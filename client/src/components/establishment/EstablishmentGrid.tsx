import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, MapPin, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';
import { YelpImageCarousel } from './YelpImageCarousel';
import { useToast } from '@/hooks/use-toast';
import { AdSense } from '../ads/AdSense';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

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
    setIsLocating(false);

    if (type === 'timeout' && retryCount < MAX_RETRIES) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        requestLocation();
      }, RETRY_DELAY);
    } else {
      setCoordinates(null);
    }
  };

  useEffect(() => {
    const cachedLocation = localStorage.getItem('lastKnownLocation');
    if (cachedLocation) {
      try {
        const { latitude, longitude, timestamp } = JSON.parse(cachedLocation);
        const oneHour = 60 * 60 * 1000;

        if (Date.now() - timestamp < oneHour) {
          setCoordinates({ latitude, longitude });
          setIsLocating(false);
        }
      } catch (error) {
        console.error('Error parsing cached location:', error);
      }
    }
  }, []);

  const requestLocation = async () => {
    if (!("geolocation" in navigator)) {
      setLocationError('unavailable');
      setErrorMessage("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setErrorMessage(null);

    const timeoutId = setTimeout(() => {
      setIsLocating(false);
      setLocationError('timeout');
      setErrorMessage("Location detection took too long. Showing general results.");
    }, 10000);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 60000,
        });
      });

      clearTimeout(timeoutId);

      const newCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setCoordinates(newCoordinates);
      setLocationError(null);
      setErrorMessage(null);
      setRetryCount(0);
      setIsLocating(false);

      localStorage.setItem('lastKnownLocation', JSON.stringify({
        ...newCoordinates,
        timestamp: Date.now()
      }));
    } catch (error) {
      clearTimeout(timeoutId);
      handleLocationError(error as GeolocationPositionError);
    }
  };

  useEffect(() => {
    if (!searchParams?.term && !searchParams?.location) {
      const checkPermissionAndLocation = async () => {
        if ("permissions" in navigator) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            setPermissionState(permissionStatus.state);

            if (permissionStatus.state === 'granted') {
              requestLocation();
            } else {
              setIsLocating(false);
            }

            permissionStatus.onchange = () => {
              setPermissionState(permissionStatus.state);
              if (permissionStatus.state === 'granted') {
                requestLocation();
              }
            };
          } catch (error) {
            console.error('Permission check error:', error);
            setLocationError('permission');
            setIsLocating(false);
          }
        }
      };

      checkPermissionAndLocation();
    } else {
      setIsLocating(false);
    }
  }, [searchParams]);

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

        <Button
          onClick={() => {
            setRetryCount(0);
            requestLocation();
          }}
          className="flex items-center gap-2"
          variant="outline"
        >
          <MapPin className="w-4 h-4" />
          Use My Location
        </Button>

        <p className="text-sm text-muted-foreground text-center max-w-md">
          {locationError === 'permission'
            ? "You can still search for restaurants by entering a location in the search box above."
            : "While we try to get your location, you can also search for restaurants by entering a location manually."}
        </p>
      </div>
    );
  }

  if (!coordinates && !searchParams?.term && !searchParams?.location && !isLocating && permissionState !== 'granted') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Button
          onClick={() => {
            setRetryCount(0);
            requestLocation();
          }}
          className="flex items-center gap-2"
          variant="outline"
          size="lg"
        >
          <MapPin className="w-5 h-5" />
          Use My Location
        </Button>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Click to show restaurants near you, or use the search box above to find specific locations
        </p>
      </div>
    );
  }

  if (searchQuery.error || nearbyQuery.error) {
    const error = searchQuery.error || nearbyQuery.error;
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  if ((searchParams && searchQuery.isLoading) || (!searchParams && nearbyQuery.isLoading)) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const establishments = searchParams?.term || searchParams?.location
    ? searchQuery.data?.businesses || []
    : nearbyQuery.data?.businesses || [];

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {establishments.map((establishment: Establishment, index: number) => {
        const items = [];
        const isImageLoaded = loadedImages[establishment.id];

        items.push(
          <Link
            key={establishment.id}
            href={`/establishments/${establishment.id}`}
            className="block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="grid grid-cols-5 h-full">
                  <div className="col-span-2 relative h-full min-h-[200px]">
                    {establishment.photos && establishment.photos.length > 0 ? (
                      <>
                        <div
                          className={`absolute inset-0 bg-muted flex items-center justify-center transition-opacity duration-300 ${
                            isImageLoaded ? 'opacity-0' : 'opacity-100'
                          }`}
                        >
                          <Skeleton className="h-full w-full" />
                        </div>
                        <img
                          src={establishment.photos[0]}
                          alt={`${establishment.name}`}
                          className={`absolute inset-0 w-full h-full object-cover rounded-l-lg transition-opacity duration-300 ${
                            isImageLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => setLoadedImages(prev => ({ ...prev, [establishment.id]: true }))}
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                  </div>

                  <div className="col-span-3 p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold line-clamp-1">{establishment.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {establishment.location.address1}, {establishment.location.city}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⭐ {establishment.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );

        if ((index + 1) % 4 === 0 && index !== establishments.length - 1) {
          items.push(
            <div key={`ad-${index}`} className="col-span-full">
              <AdSense
                slot="3995394341" // Unique ad slot ID for establishment grid
                format="auto"
                className="w-full min-h-[90px] bg-gray-50"
                responsive={true}
              />
            </div>
          );
        }

        return items;
      }).flat()}
    </div>
  );
}