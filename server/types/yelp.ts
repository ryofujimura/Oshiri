import { z } from 'zod';

export interface YelpCoordinates {
  latitude: number;
  longitude: number;
}

export interface YelpLocation {
  address1: string;
  address2?: string;
  address3?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  formatted_address?: string;
}

export interface YelpBusiness {
  id: string;
  name: string;
  coordinates: YelpCoordinates;
  location: YelpLocation;
  phone: string;
  rating: string;
  review_count: number;
  categories: Array<{ alias: string; title: string }>;
  photos?: string[];
  price?: string;
  url: string;
}

export interface SearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: YelpCoordinates;
  };
}

export const yelpBusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  location: z.object({
    address1: z.string(),
    address2: z.string().optional(),
    address3: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip_code: z.string(),
    country: z.string(),
    formatted_address: z.string().optional(),
  }),
  phone: z.string(),
  rating: z.string(),
  review_count: z.number(),
  categories: z.array(z.object({
    alias: z.string(),
    title: z.string(),
  })),
  photos: z.array(z.string()).optional(),
  price: z.string().optional(),
  url: z.string(),
});

export type Business = z.infer<typeof yelpBusinessSchema>;
