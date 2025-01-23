import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

export function EstablishmentGrid() {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setLocationError("Please enable location services to see nearby establishments");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
    }
  }, []);

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ['/api/establishments/nearby', coordinates?.latitude, coordinates?.longitude],
    queryFn: async () => {
      if (!coordinates) return [];
      const response = await fetch(
        `/api/establishments/nearby?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`
      );
      if (!response.ok) throw new Error('Failed to fetch establishments');
      return response.json();
    },
    enabled: !!coordinates,
  });

  if (locationError) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {establishments.businesses?.map((establishment: Establishment) => (
        <Card key={establishment.id}>
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
              <Button variant="outline" size="sm">
                View Seats
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
