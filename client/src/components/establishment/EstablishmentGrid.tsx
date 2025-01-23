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
    // Get location if:
    // 1. No search params provided (showing nearby)
    // 2. Search term provided but no location (use current location)
    if ((!searchParams || (searchParams.term && !searchParams.location)) && "geolocation" in navigator) {
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
        }
      );
    }
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: searchParams 
      ? ['/api/establishments/search', searchParams.term, searchParams.location || coordinates?.latitude]
      : ['/api/establishments/nearby', coordinates?.latitude, coordinates?.longitude],
    queryFn: async () => {
      let url = '/api/establishments/';

      if (searchParams?.term) {
        const params = new URLSearchParams({
          term: searchParams.term,
        });

        if (searchParams.location) {
          params.append('location', searchParams.location);
        } else if (coordinates) {
          params.append('latitude', coordinates.latitude.toString());
          params.append('longitude', coordinates.longitude.toString());
        }

        url += `search?${params}`;
      } else if (coordinates) {
        url += `nearby?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`;
      } else {
        return { businesses: [] };
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch establishments');
      return response.json();
    },
    enabled: !!(searchParams?.term || coordinates),
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading establishments. Please try again later.</p>
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