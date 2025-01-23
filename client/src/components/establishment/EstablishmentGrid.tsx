import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { YelpImageCarousel } from './YelpImageCarousel';
import { useToast } from '@/hooks/use-toast';

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
type LocationErrorType = 'permission' | 'timeout' | 'position' | 'unavailable' | null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function EstablishmentGrid({ searchParams }: EstablishmentGridProps) {
  const { toast } = useToast();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<LocationErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Function to handle different types of location errors
  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    let type: LocationErrorType = 'position';
    let message = "Unable to get your location. Showing general results instead.";

    switch (error.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        type = 'permission';
        message = "Location access was denied. Please enable location services to see nearby restaurants.";
        break;
      case GeolocationPositionError.TIMEOUT:
        type = 'timeout';
        message = "Location request timed out. Retrying...";
        break;
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        type = 'unavailable';
        message = "Unable to determine your location. Please check your device settings or try again later.";
        break;
    }

    setLocationError(type);
    setErrorMessage(message);

    // Show error toast
    toast({
      title: "Location Error",
      description: message,
      variant: type === 'timeout' ? 'default' : 'destructive',
    });

    // Retry for timeout or unavailable errors
    if ((type === 'timeout' || type === 'unavailable') && retryCount < MAX_RETRIES) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        requestLocation();
      }, RETRY_DELAY);
    } else {
      setCoordinates(null);
      setIsLocating(false);
    }
  };

  // Try to load cached location
  useEffect(() => {
    const cachedLocation = localStorage.getItem('lastKnownLocation');
    if (cachedLocation) {
      try {
        const { latitude, longitude, timestamp } = JSON.parse(cachedLocation);
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        // Only use cached location if it's less than 1 hour old
        if (Date.now() - timestamp < oneHour) {
          setCoordinates({ latitude, longitude });
        }
      } catch (error) {
        console.error('Error parsing cached location:', error);
      }
    }
  }, []);

  // Function to request and handle location
  const requestLocation = async () => {
    if (!("geolocation" in navigator)) {
      setLocationError('unavailable');
      setErrorMessage("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setErrorMessage(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 60000, // Allow 1-minute old cached positions
        });
      });

      const newCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setCoordinates(newCoordinates);
      setLocationError(null);
      setErrorMessage(null);
      setRetryCount(0);

      // Cache the location with timestamp
      localStorage.setItem('lastKnownLocation', JSON.stringify({
        ...newCoordinates,
        timestamp: Date.now()
      }));

      toast({
        title: "Location detected",
        description: "Showing nearby restaurants",
      });
    } catch (error) {
      handleLocationError(error as GeolocationPositionError);
    } finally {
      if (retryCount >= MAX_RETRIES) {
        setIsLocating(false);
      }
    }
  };

  // Check permission and request location on mount
  useEffect(() => {
    const checkPermissionAndLocation = async () => {
      if ("permissions" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(permissionStatus.state);

          // If permission is granted, get location immediately
          if (permissionStatus.state === 'granted') {
            requestLocation();
          }

          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
            if (permissionStatus.state === 'granted') {
              requestLocation();
            }
          };
        } catch (error) {
          console.error('Permission check error:', error);
          setLocationError('permission');
        }
      }
    };

    checkPermissionAndLocation();
  }, []);

  // Query for nearby establishments (default view)
  const nearbyQuery = useQuery({
    queryKey: ['nearby-establishments', coordinates?.latitude, coordinates?.longitude],
    queryFn: async () => {
      if (!coordinates) return null;

      const params = new URLSearchParams({
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
        radius: '5000', // 5km radius
      });

      const response = await fetch(`/api/establishments/nearby?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch nearby establishments');
      }
      return response.json();
    },
    enabled: !!coordinates && !searchParams?.term && !searchParams?.location,
  });

  // Query for search results (when user searches)
  const searchQuery = useQuery({
    queryKey: ['establishments', searchParams?.term, searchParams?.location],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (searchParams?.term) {
        params.append('term', searchParams.term);
      }

      if (searchParams?.location) {
        params.append('location', searchParams.location);
      } else if (coordinates) {
        params.append('latitude', coordinates.latitude.toString());
        params.append('longitude', coordinates.longitude.toString());
      }

      const response = await fetch(`/api/establishments/search?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch establishments');
      }
      return response.json();
    },
    enabled: !!(searchParams?.term || searchParams?.location),
  });

  // Show loading state with retry count if applicable
  if (isLocating) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>
            {retryCount > 0 
              ? `Retrying location detection (Attempt ${retryCount}/${MAX_RETRIES})...`
              : "Detecting your location..."}
          </span>
        </div>
      </div>
    );
  }

  // Handle errors with appropriate messages and actions
  if (locationError && !searchParams?.location) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Alert 
          variant={locationError === 'timeout' ? 'default' : 'destructive'}
          className="max-w-md"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>

        {locationError !== 'permission' && (
          <Button
            onClick={() => {
              setRetryCount(0);
              requestLocation();
            }}
            className="flex items-center gap-2"
            variant="outline"
          >
            <MapPin className="w-4 h-4" />
            Try Again
          </Button>
        )}

        <p className="text-sm text-muted-foreground text-center max-w-md">
          {locationError === 'permission'
            ? "You can still search for restaurants by entering a location in the search box above."
            : "While we try to get your location, you can also search for restaurants by entering a location manually."}
        </p>
      </div>
    );
  }

  // Handle query errors
  if (searchQuery.error || nearbyQuery.error) {
    const error = searchQuery.error || nearbyQuery.error;
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  // Show loading state for queries
  if ((searchParams && searchQuery.isLoading) || (!searchParams && nearbyQuery.isLoading)) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Determine which data to show
  const establishments = searchParams?.term || searchParams?.location
    ? searchQuery.data?.businesses
    : nearbyQuery.data?.businesses;

  if (!establishments?.length) {
    return (
      <Alert className="my-4">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          {searchParams?.term || searchParams?.location
            ? "No establishments found. Try adjusting your search criteria."
            : "No nearby establishments found. Try searching for a specific location."}
        </AlertDescription>
      </Alert>
    );
  }

  // Render establishment grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {establishments.map((establishment: Establishment) => (
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