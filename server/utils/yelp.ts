import yelp from 'yelp-fusion';
import type { SearchResponse, Business } from '../types/yelp';

if (!process.env.YELP_API_KEY) {
  throw new Error('YELP_API_KEY must be set');
}

// @ts-ignore - yelp-fusion doesn't have type definitions
const client = yelp.client(process.env.YELP_API_KEY);

interface SearchParams {
  latitude?: number;
  longitude?: number;
  location?: string;
  radius?: number; // in meters
  limit?: number;
  offset?: number;
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  categories?: string;
  price?: string;
  open_now?: boolean;
  term?: string;
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch business details with retries
async function fetchBusinessDetails(businessId: string, retryCount = 0): Promise<Business> {
  try {
    // Add delay to respect rate limiting
    await delay(100); // 100ms delay between requests

    // @ts-ignore - yelp-fusion doesn't have type definitions
    const response = await client.business(businessId);
    return response.jsonBody;
  } catch (error: any) {
    if (error.response?.statusCode === 429 && retryCount < 3) {
      // If rate limited, wait longer and retry
      await delay(1000 * (retryCount + 1)); // Exponential backoff
      return fetchBusinessDetails(businessId, retryCount + 1);
    }
    throw error;
  }
}

export async function searchEstablishments(params: SearchParams): Promise<SearchResponse> {
  try {
    if (!params.location && (!params.latitude || !params.longitude)) {
      throw new Error('Either location or coordinates (latitude/longitude) must be provided');
    }

    // Set default parameters and include photos
    const searchParams = {
      term: params.term || '',
      categories: 'restaurants,cafes',
      limit: params.limit || 20,
      ...params,
    };

    // @ts-ignore - yelp-fusion doesn't have type definitions
    const response = await client.search(searchParams);
    const businesses = response.jsonBody.businesses;

    // Process businesses in smaller batches to avoid rate limiting
    const batchSize = 5;
    const businessesWithPhotos = [];

    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (business: Business) => {
          try {
            const details = await fetchBusinessDetails(business.id);
            return {
              ...business,
              photos: details.photos || []
            };
          } catch (error) {
            console.error(`Error fetching photos for business ${business.id}:`, error);
            // Return the business with existing photos if available, or empty array
            return {
              ...business,
              photos: business.photos || []
            };
          }
        })
      );
      businessesWithPhotos.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < businesses.length) {
        await delay(500); // 500ms delay between batches
      }
    }

    return {
      ...response.jsonBody,
      businesses: businessesWithPhotos
    } as SearchResponse;
  } catch (error: any) {
    console.error('Error searching establishments:', error);
    throw new Error(error.response?.body?.error?.description || error.message);
  }
}

export async function getEstablishmentDetails(yelpId: string): Promise<Business & { photos: string[] }> {
  try {
    const business = await fetchBusinessDetails(yelpId);
    return {
      ...business,
      photos: business.photos || []
    };
  } catch (error: any) {
    console.error('Error getting establishment details:', error);
    throw new Error(error.response?.body?.error?.description || error.message);
  }
}

export async function searchNearbyEstablishments(
  latitude: number,
  longitude: number,
  radius: number = 1000, // Default 1km radius
  term?: string
): Promise<SearchResponse> {
  return searchEstablishments({
    latitude,
    longitude,
    radius,
    term,
    categories: 'restaurants,cafes',
    sort_by: 'distance'
  });
}