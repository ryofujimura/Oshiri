import { db } from "@db";
import { contents, images } from "@db/schema";
import { eq, isNotNull } from "drizzle-orm";

export async function migrateImageData() {
  try {
    // Get all contents with existing image_url
    const contentsWithImages = await db
      .select()
      .from(contents)
      .where(isNotNull(contents.imageUrl));

    // For each content with an image, create a new image record
    for (const content of contentsWithImages) {
      if (content.imageUrl) {
        await db.insert(images).values({
          imageUrl: content.imageUrl,
          contentId: content.id,
        });
      }
    }

    console.log('Successfully migrated image data');
  } catch (error) {
    console.error('Error migrating image data:', error);
    throw error;
  }
}
