import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { YelpImageCarousel } from './YelpImageCarousel';

interface Establishment {
  id: string;
  name: string;
  location: {
    address1: string;
    city: string;
    state: string;
  };
  rating: string;
  photos?: string[];
}

interface SearchParams {
  term?: string;
  location?: string;
}

interface EstablishmentGridProps {
  searchParams?: SearchParams;
}

type PermissionState = 'granted' | 'denied' | 'prompt';

export function EstablishmentGrid({ searchParams }: EstablishmentGridProps) {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  useEffect(() => {
    // Check if geolocation permissions are already granted
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          setPermissionState(permissionStatus.state);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        });
    }
  }, []);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Please enable location services or provide a location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access was denied. Please provide a location in the search box.";
        }
        setLocationError(errorMessage);
        setCoordinates(null);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Only try to get location automatically if no manual location is provided
  useEffect(() => {
    if (!searchParams?.location && permissionState === 'granted') {
      requestLocation();
    } else {
      setCoordinates(null);
      setIsLocating(false);
    }
  }, [searchParams?.location, permissionState]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['establishments', searchParams?.term, searchParams?.location || coordinates?.latitude],
    queryFn: async () => {
      let url = '/api/establishments/search?';
      const params = new URLSearchParams();

      if (searchParams?.term) {
        params.append('term', searchParams.term);
      }

      if (searchParams?.location && searchParams.location.trim() !== '') {
        params.append('location', searchParams.location);
      } else if (coordinates) {
        params.append('latitude', coordinates.latitude.toString());
        params.append('longitude', coordinates.longitude.toString());
      } else if (!isLocating) {
        throw new Error("Please provide a location or enable location services");
      }

      const response = await fetch(`${url}${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch establishments');
      }
      return response.json();
    },
    enabled: !!(
      (searchParams?.location && searchParams.location.trim() !== '') ||
      coordinates ||
      isLocating === false
    ),
  });

  if (isLocating) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Detecting your location...</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You can also enter a location manually in the search box above
        </p>
      </div>
    );
  }

  const showLocationButton = !coordinates && !searchParams?.location && !isLocating;

  if (showLocationButton) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Button
          onClick={requestLocation}
          className="flex items-center gap-2"
          variant="outline"
          size="lg"
        >
          <MapPin className="w-5 h-5" />
          Use My Location
        </Button>
        {locationError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground">
          Or enter a location manually in the search box above
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
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
      <Alert className="my-4">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          No establishments found. Try adjusting your search criteria or providing a different location.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.businesses.map((establishment: Establishment) => (
        <Card key={establishment.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            {establishment.photos && establishment.photos.length > 0 && (
              <div className="mb-4">
                <YelpImageCarousel
                  photos={establishment.photos}
                  aspectRatio={3 / 2}
                  className="h-[120px]"
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{establishment.name}</h3>
              <p className="text-sm text-muted-foreground">
                {establishment.location.address1}, {establishment.location.city}
              </p>
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rating: {establishment.rating}</span>
                </div>
                <Link href={`/establishments/${establishment.id}`}>
                  <Button variant="outline" size="sm">
                    View Seats
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}