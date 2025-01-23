import { type Express, type Request, type Response } from "express";
import { establishments, seats, users, images, type InsertEstablishment } from "@db/schema";
import { db } from "@db";
import { eq, and } from "drizzle-orm";
import { searchEstablishments, getEstablishmentDetails } from "./utils/yelp";
import type { SearchResponse, Business } from "./types/yelp";
import { insertSeatSchema, insertImageSchema } from "@db/schema";
import { uploadImage } from "./utils/cloudinary";
import multer from "multer";

// Setup multer for handling file uploads
const upload = multer({ dest: "uploads/" });

export function setupEstablishmentRoutes(app: Express) {
  // Search establishments (uses Yelp API)
  app.get("/api/establishments/search", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, location, radius, limit, term } = req.query;

      // Prepare search parameters
      const searchParams: any = {
        categories: 'restaurants,cafes',
      };

      // Handle coordinates-based search
      if (latitude && longitude) {
        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({ message: "Invalid coordinates provided" });
        }

        searchParams.latitude = lat;
        searchParams.longitude = lng;
        searchParams.sort_by = 'distance';
      }
      // Handle location-based search
      else if (location) {
        if (location.toString().trim() === '') {
          return res.status(400).json({ message: "Please enter a valid location" });
        }
        searchParams.location = location.toString().trim();
        searchParams.sort_by = 'best_match';
      }
      // If neither coordinates nor location provided
      else {
        return res.status(400).json({ 
          message: "Please provide either a location (city, address) or wait for location detection to complete" 
        });
      }

      // Add optional parameters
      if (radius) searchParams.radius = parseInt(radius as string);
      if (limit) searchParams.limit = parseInt(limit as string);
      if (term) searchParams.term = term;

      const searchResults = await searchEstablishments(searchParams);
      res.json(searchResults);
    } catch (error: any) {
      console.error('Error searching establishments:', error);

      // Parse Yelp API error message if available
      let errorMessage = 'Error searching establishments. Please try again.';

      try {
        if (error.response?.body) {
          const yelpError = JSON.parse(error.response.body).error;
          if (yelpError?.description) {
            errorMessage = yelpError.description;
            if (errorMessage.includes("is too short")) {
              errorMessage = "Please provide a more specific location";
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        console.error('Error parsing Yelp error response:', parseError);
      }

      res.status(error.statusCode || 500).json({ message: errorMessage });
    }
  });

  // Get nearby establishments
  app.get("/api/establishments/nearby", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius = "1000", term } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: "Invalid coordinates provided" });
      }

      const searchResults = await searchEstablishments({
        latitude: lat,
        longitude: lng,
        radius: parseInt(radius as string),
        categories: 'restaurants,cafes',
        sort_by: 'distance',
        term: term as string | undefined,
        limit: 20 // Limit results to prevent overwhelming response
      });

      res.json(searchResults);
    } catch (error: any) {
      console.error('Error getting nearby establishments:', error);
      const errorMessage = error.response?.body ? JSON.parse(error.response.body).error?.description : error.message;
      res.status(error.statusCode || 500).json({ message: errorMessage || 'Error loading establishments. Please try again.' });
    }
  });

  // Get establishment details (combines Yelp data with our data)
  app.get("/api/establishments/:yelpId", async (req: Request, res: Response) => {
    try {
      const { yelpId } = req.params;

      // First check our database
      const [existingEstablishment] = await db
        .select()
        .from(establishments)
        .where(eq(establishments.yelpId, yelpId))
        .limit(1);

      // Get fresh data from Yelp
      const yelpData = await getEstablishmentDetails(yelpId);

      // If establishment exists in our database, merge the data
      if (existingEstablishment) {
        res.json({
          ...yelpData,
          id: existingEstablishment.id,
          // Add any additional local data here
        });
      } else {
        // Create new establishment in our database
        const [newEstablishment] = await db
          .insert(establishments)
          .values({
            yelpId: yelpData.id,
            name: yelpData.name,
            address: yelpData.location.address1 || '',
            city: yelpData.location.city,
            state: yelpData.location.state,
            zipCode: yelpData.location.zip_code,
            latitude: yelpData.coordinates.latitude.toString(),
            longitude: yelpData.coordinates.longitude.toString(),
            yelpRating: yelpData.rating.toString(),
            phone: yelpData.phone
          } as InsertEstablishment)
          .returning();

        res.json({
          ...yelpData,
          id: newEstablishment.id,
        });
      }
    } catch (error: any) {
      console.error('Error getting establishment details:', error);
      const errorMessage = error.response?.body ? JSON.parse(error.response.body).error?.description : error.message;
      res.status(error.statusCode || 500).json({ message: errorMessage || 'Error loading establishment details. Please try again.' });
    }
  });

  // Get seats for a specific establishment
  app.get("/api/establishments/:yelpId/seats", async (req: Request, res: Response) => {
    try {
      const { yelpId } = req.params;

      // First get the establishment ID from our database
      const [establishment] = await db
        .select()
        .from(establishments)
        .where(eq(establishments.yelpId, yelpId))
        .limit(1);

      if (!establishment) {
        return res.status(404).json({ message: "Establishment not found" });
      }

      // Now get all seats with user and image data
      const establishmentSeats = await db.query.seats.findMany({
        where: eq(seats.establishmentId, establishment.id),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
            }
          },
          images: true
        }
      });

      res.json(establishmentSeats);
    } catch (error: any) {
      console.error('Error getting establishment seats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add visibility toggle endpoint for admins
  app.post("/api/establishments/:yelpId/seats/:seatId/visibility", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Must be logged in to manage reviews" });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can manage review visibility" });
      }

      const { seatId } = req.params;
      const { isVisible } = req.body;

      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "Invalid visibility value" });
      }

      const [updatedSeat] = await db
        .update(seats)
        .set({ isVisible })
        .where(eq(seats.id, parseInt(seatId)))
        .returning();

      if (!updatedSeat) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(updatedSeat);
    } catch (error: any) {
      console.error('Error updating seat visibility:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add a new seat review with images
  app.post(
    "/api/establishments/:yelpId/seats",
    upload.array("images", 5), // Allow up to 5 images
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Must be logged in to add reviews" });
        }

        const { yelpId } = req.params;

        // First get or create the establishment
        let [establishment] = await db
          .select()
          .from(establishments)
          .where(eq(establishments.yelpId, yelpId))
          .limit(1);

        if (!establishment) {
          // Get establishment data from Yelp
          const yelpData = await getEstablishmentDetails(yelpId);

          [establishment] = await db
            .insert(establishments)
            .values({
              yelpId: yelpData.id,
              name: yelpData.name,
              address: yelpData.location.address1 || '',
              city: yelpData.location.city,
              state: yelpData.location.state,
              zipCode: yelpData.location.zip_code,
              latitude: yelpData.coordinates.latitude.toString(),
              longitude: yelpData.coordinates.longitude.toString(),
              yelpRating: yelpData.rating.toString(),
              phone: yelpData.phone
            } as InsertEstablishment)
            .returning();
        }

        // Convert form data types before validation
        const formData = {
          ...req.body,
          capacity: req.body.capacity ? parseInt(req.body.capacity) : undefined,
          hasPowerOutlet: req.body.hasPowerOutlet === 'true',
          userId: req.user.id,
          establishmentId: establishment.id
        };

        // Validate and insert the seat review
        const result = insertSeatSchema.safeParse(formData);

        if (!result.success) {
          return res.status(400).json({
            message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
          });
        }

        // Insert the seat first
        const [newSeat] = await db
          .insert(seats)
          .values(result.data)
          .returning();

        // Handle image uploads with pending moderation status
        const uploadedImages = [];
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files) {
            try {
              const uploadResult = await uploadImage(file);
              const [image] = await db.insert(images)
                .values({
                  seatId: newSeat.id,
                  imageUrl: uploadResult.secure_url,
                  publicId: uploadResult.public_id,
                  width: uploadResult.width,
                  height: uploadResult.height,
                  format: uploadResult.format,
                  moderationStatus: 'pending'
                })
                .returning();
              uploadedImages.push(image);
            } catch (uploadError) {
              console.error('Error uploading image:', uploadError);
            }
          }
        }

        // Return the seat with its pending images
        const seatWithImages = {
          ...newSeat,
          images: uploadedImages,
          user: {
            id: req.user.id,
            username: req.user.username
          }
        };

        res.json({
          ...seatWithImages,
          message: uploadedImages.length > 0 
            ? "Your review has been submitted. The uploaded images will be visible after admin approval."
            : "Your review has been submitted successfully."
        });
      } catch (error: any) {
        console.error('Error adding seat review:', error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post("/api/establishments/:yelpId/seats/:seatId/vote", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Must be logged in to vote" });
      }

      const { seatId } = req.params;
      const { voteType } = req.body;

      if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
      }

      // Get the current seat
      const [seat] = await db
        .select()
        .from(seats)
        .where(eq(seats.id, parseInt(seatId)))
        .limit(1);

      if (!seat) {
        return res.status(404).json({ message: "Seat not found" });
      }

      // Update the vote count
      const [updatedSeat] = await db
        .update(seats)
        .set({
          upvotes: voteType === 'upvote' ? seat.upvotes + 1 : seat.upvotes,
          downvotes: voteType === 'downvote' ? seat.downvotes + 1 : seat.downvotes,
        })
        .where(eq(seats.id, parseInt(seatId)))
        .returning();

      res.json(updatedSeat);
    } catch (error: any) {
      console.error('Error voting on seat:', error);
      res.status(500).json({ message: error.message });
    }
  });
  // Add new route for recent reviews
  app.get("/api/reviews/recent", async (_req: Request, res: Response) => {
    try {
      const recentSeats = await db.query.seats.findMany({
        limit: 6,
        orderBy: (seats, { desc }) => [desc(seats.createdAt)],
        with: {
          user: {
            columns: {
              username: true,
            }
          },
          establishment: {
            columns: {
              name: true,
              yelpId: true,
            }
          }
        }
      });

      res.json(recentSeats);
    } catch (error: any) {
      console.error('Error fetching recent reviews:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add new route for image moderation
  app.post("/api/images/:imageId/moderate", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Must be logged in to moderate images" });
      }

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can moderate images" });
      }

      const { imageId } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid moderation status" });
      }

      const [updatedImage] = await db
        .update(images)
        .set({
          moderationStatus: status,
          moderatedBy: req.user.id,
          moderatedAt: new Date(),
        })
        .where(eq(images.id, parseInt(imageId)))
        .returning();

      if (!updatedImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json(updatedImage);
    } catch (error: any) {
      console.error('Error moderating image:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add route to get pending images for moderation
  app.get("/api/images/pending", async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view pending images" });
      }

      const pendingImages = await db.query.images.findMany({
        where: eq(images.moderationStatus, 'pending'),
        with: {
          seat: {
            with: {
              establishment: true,
              user: {
                columns: {
                  username: true,
                }
              }
            }
          }
        },
        orderBy: (images, { asc }) => [asc(images.createdAt)]
      });

      res.json(pendingImages);
    } catch (error: any) {
      console.error('Error fetching pending images:', error);
      res.status(500).json({ message: error.message });
    }
  });
}