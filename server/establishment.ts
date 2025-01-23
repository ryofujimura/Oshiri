import { type Express, type Request, type Response } from "express";
import { establishments, seats, type InsertEstablishment } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { searchEstablishments, getEstablishmentDetails } from "./utils/yelp";
import type { SearchResponse, Business } from "./types/yelp";
import { insertSeatSchema } from "@db/schema";

export function setupEstablishmentRoutes(app: Express) {
  // Search establishments (uses Yelp API)
  app.get("/api/establishments/search", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, location, radius, limit, term } = req.query;

      const searchResults = await searchEstablishments({
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        location: location as string | undefined,
        radius: radius ? parseInt(radius as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        term: term as string | undefined,
        categories: 'restaurants,cafes',
        sort_by: location ? 'best_match' : 'distance'
      });

      res.json(searchResults);
    } catch (error: any) {
      console.error('Error searching establishments:', error);
      res.status(500).json({ message: error.message });
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
            latitude: yelpData.coordinates.latitude,
            longitude: yelpData.coordinates.longitude,
            yelpRating: parseFloat(yelpData.rating),
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
      res.status(500).json({ message: error.message });
    }
  });

  // Get nearby establishments
  app.get("/api/establishments/nearby", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius, term } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const searchResults = await searchEstablishments({
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radius: radius ? parseInt(radius as string) : 1000,
        categories: 'restaurants,cafes',
        sort_by: 'distance',
        term: term as string | undefined
      });

      res.json(searchResults);
    } catch (error: any) {
      console.error('Error getting nearby establishments:', error);
      res.status(500).json({ message: error.message });
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

      // Now get the seats for this establishment
      const establishmentSeats = await db
        .select()
        .from(seats)
        .where(eq(seats.establishmentId, establishment.id));

      res.json(establishmentSeats);
    } catch (error: any) {
      console.error('Error getting establishment seats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add a new seat review
  app.post("/api/establishments/:yelpId/seats", async (req: Request, res: Response) => {
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
            latitude: yelpData.coordinates.latitude,
            longitude: yelpData.coordinates.longitude,
            yelpRating: parseFloat(yelpData.rating),
            phone: yelpData.phone
          } as InsertEstablishment)
          .returning();
      }

      // Validate and insert the seat review
      const result = insertSeatSchema.safeParse({
        ...req.body,
        userId: req.user.id,
        establishmentId: establishment.id
      });

      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input: " + result.error.issues.map(i => i.message).join(", ")
        });
      }

      const [newSeat] = await db
        .insert(seats)
        .values(result.data)
        .returning();

      res.json(newSeat);
    } catch (error: any) {
      console.error('Error adding seat review:', error);
      res.status(500).json({ message: error.message });
    }
  });
}