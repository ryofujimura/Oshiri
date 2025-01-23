import { type Express, type Request, type Response } from "express";
import { db } from "@db";
import { seats, seatEditRequests, users, establishments } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export function setupUserRoutes(app: Express) {
  // Get user's reviews
  app.get("/api/users/reviews", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Must be logged in to view reviews" });
      }

      // If admin, can view all reviews. Otherwise, only user's own reviews
      const userReviews = await db.query.seats.findMany({
        where: req.user.role === 'admin' ? undefined : eq(seats.userId, req.user.id),
        orderBy: [desc(seats.createdAt)],
        with: {
          establishment: true,
          user: true,
          editRequests: {
            where: eq(seatEditRequests.status, 'pending')
          }
        }
      });

      res.json(userReviews);
    } catch (error: any) {
      console.error('Error getting user reviews:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Submit edit/delete request with draft changes
  app.post("/api/seats/:seatId/requests", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Must be logged in to submit requests" });
      }

      const { seatId } = req.params;
      const { type, ...changes } = req.body;

      // Check if seat exists
      const [seat] = await db
        .select()
        .from(seats)
        .where(eq(seats.id, parseInt(seatId)))
        .limit(1);

      if (!seat) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Admin can directly edit/delete
      if (req.user.role === 'admin') {
        if (type === 'delete') {
          await db
            .update(seats)
            .set({ status: 'deleted' })
            .where(eq(seats.id, parseInt(seatId)));

          return res.json({ message: "Review deleted successfully" });
        } else {
          const [updatedSeat] = await db
            .update(seats)
            .set({ ...changes, updatedAt: new Date() })
            .where(eq(seats.id, parseInt(seatId)))
            .returning();

          return res.json(updatedSeat);
        }
      }

      // Regular users must submit edit request
      if (seat.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this review" });
      }

      // Create edit request with draft changes
      const [editRequest] = await db
        .insert(seatEditRequests)
        .values({
          seatId: parseInt(seatId),
          userId: req.user.id,
          requestType: type,
          ...(type === 'edit' ? changes : {}),
          status: 'pending'
        })
        .returning();

      res.json({
        ...editRequest,
        message: "Your edit request has been submitted for admin approval"
      });
    } catch (error: any) {
      console.error('Error submitting edit request:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get pending edit requests (admin only)
  app.get("/api/users/edit-requests", async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view edit requests" });
      }

      const editRequests = await db.query.seatEditRequests.findMany({
        where: eq(seatEditRequests.status, 'pending'),
        orderBy: [desc(seatEditRequests.createdAt)],
        with: {
          seat: {
            with: {
              establishment: true,
              user: {
                columns: {
                  username: true
                }
              }
            }
          },
          user: {
            columns: {
              username: true
            }
          }
        }
      });

      res.json(editRequests);
    } catch (error: any) {
      console.error('Error getting edit requests:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Handle edit request approval/rejection (admin only)
  app.post("/api/edit-requests/:requestId/:action", async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can moderate edit requests" });
      }

      const { requestId, action } = req.params;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      // Get the edit request with current seat data
      const [editRequest] = await db
        .select()
        .from(seatEditRequests)
        .where(eq(seatEditRequests.id, parseInt(requestId)))
        .limit(1);

      if (!editRequest) {
        return res.status(404).json({ message: "Edit request not found" });
      }

      if (editRequest.status !== 'pending') {
        return res.status(400).json({ message: "Request has already been processed" });
      }

      // Update the request status
      const [updatedRequest] = await db
        .update(seatEditRequests)
        .set({
          status: action === 'approve' ? 'approved' : 'rejected',
          adminId: req.user.id,
          updatedAt: new Date()
        })
        .where(eq(seatEditRequests.id, parseInt(requestId)))
        .returning();

      // If approved, apply the changes
      if (action === 'approve') {
        if (editRequest.requestType === 'delete') {
          await db
            .update(seats)
            .set({ status: 'deleted' })
            .where(eq(seats.id, editRequest.seatId));
        } else {
          const changes = {
            type: editRequest.type,
            capacity: editRequest.capacity,
            comfortRating: editRequest.comfortRating,
            hasPowerOutlet: editRequest.hasPowerOutlet,
            noiseLevel: editRequest.noiseLevel,
            description: editRequest.description,
            updatedAt: new Date()
          };

          // Remove null values from changes
          Object.keys(changes).forEach(key => {
            if (changes[key] === null) {
              delete changes[key];
            }
          });

          await db
            .update(seats)
            .set(changes)
            .where(eq(seats.id, editRequest.seatId));
        }
      }

      res.json(updatedRequest);
    } catch (error: any) {
      console.error('Error processing edit request:', error);
      res.status(500).json({ message: error.message });
    }
  });
}