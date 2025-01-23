import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface Establishment {
  id: string;
  name: string;
  location: {
    address1: string;
    city: string;
    state: string;
  };
  rating: string;
}

interface SearchParams {
  term?: string;
  location?: string;
}

interface EstablishmentGridProps {
  searchParams?: SearchParams;
}

export function EstablishmentGrid({ searchParams }: EstablishmentGridProps) {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get location if no location is provided in search params
    if ((!searchParams?.location || searchParams.location.trim() === '') && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError("Please enable location services or provide a location");
          setCoordinates(null);
        }
      );
    } else {
      // If location is provided in search params, clear coordinates
      setCoordinates(null);
    }
  }, [searchParams?.location]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['establishments', searchParams?.term, searchParams?.location || coordinates?.latitude],
    queryFn: async () => {
      let url = '/api/establishments/search?';
      const params = new URLSearchParams();

      // Add search term if provided
      if (searchParams?.term) {
        params.append('term', searchParams.term);
      }

      // Add location if provided, otherwise use coordinates
      if (searchParams?.location && searchParams.location.trim() !== '') {
        params.append('location', searchParams.location);
      } else if (coordinates) {
        params.append('latitude', coordinates.latitude.toString());
        params.append('longitude', coordinates.longitude.toString());
      }

      // If neither location nor coordinates are available, return empty results
      if (!searchParams?.location && !coordinates) {
        return { businesses: [] };
      }

      const response = await fetch(`${url}${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch establishments');
      }
      return response.json();
    },
    enabled: !!(
      (searchParams?.term || searchParams?.location) || 
      (coordinates && (!searchParams?.location || searchParams.location.trim() === ''))
    ),
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{(error as Error).message}</p>
      </div>
    );
  }

  if (!searchParams && locationError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{locationError}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data?.businesses?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No establishments found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.businesses.map((establishment: Establishment) => (
        <Card key={establishment.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <h3 className="text-lg font-semibold">{establishment.name}</h3>
            <p className="text-sm text-muted-foreground">
              {establishment.location.address1}, {establishment.location.city}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Rating: {establishment.rating}</span>
              </div>
              <Link href={`/establishments/${establishment.id}`}>
                <Button variant="outline" size="sm">
                  View Seats
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}