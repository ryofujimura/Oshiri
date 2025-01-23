import { db } from "@db";
import { establishments, seats, images } from "@db/schema";
import { eq } from "drizzle-orm";

// Function to migrate data from old content structure to new seating structure
export async function migrateData() {
  try {
    // First, create a default establishment for old content
    const [defaultEstablishment] = await db
      .insert(establishments)
      .values({
        yelpId: 'legacy-content',
        name: 'Legacy Content',
        address: 'N/A',
        city: 'N/A',
        state: 'N/A',
        zipCode: 'N/A',
        latitude: 0,
        longitude: 0,
      })
      .returning();

    // Get all old content
    const oldContents = await db.query.contents.findMany({
      with: {
        images: true,
        user: true,
      },
    });

    // For each old content, create a new seat
    for (const content of oldContents) {
      // Create new seat
      const [newSeat] = await db
        .insert(seats)
        .values({
          establishmentId: defaultEstablishment.id,
          userId: content.userId || 1, // Default to user 1 if no user
          type: 'unknown',
          capacity: 1,
          comfortRating: 'unknown',
          hasPowerOutlet: false,
          description: content.description,
          upvotes: content.upvotes,
          downvotes: content.downvotes,
        })
        .returning();

      // Migrate images
      if (content.images && content.images.length > 0) {
        const imageData = content.images.map(image => ({
          seatId: newSeat.id,
          imageUrl: image.imageUrl,
          publicId: image.publicId,
          width: image.width,
          height: image.height,
          format: image.format,
        }));

        await db.insert(images).values(imageData);
      }
    }

    console.log('Successfully migrated data to new schema');
  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  }
}