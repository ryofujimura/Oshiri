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

export async function searchEstablishments(params: SearchParams): Promise<SearchResponse> {
  try {
    // Ensure either location or coordinates are provided
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

    // Fetch additional details including photos for each business
    const businessesWithPhotos = await Promise.all(
      businesses.map(async (business: Business) => {
        try {
          // @ts-ignore - yelp-fusion doesn't have type definitions
          const detailResponse = await client.business(business.id);
          return {
            ...business,
            photos: detailResponse.jsonBody.photos || []
          };
        } catch (error) {
          console.error(`Error fetching photos for business ${business.id}:`, error);
          return {
            ...business,
            photos: []
          };
        }
      })
    );

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
    // @ts-ignore - yelp-fusion doesn't have type definitions
    const response = await client.business(yelpId);
    const business = response.jsonBody as Business;

    // Add photos to the response if available
    const photos = business.photos || [];
    return {
      ...business,
      photos: photos.slice(0, 5) // Limit to first 5 photos
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