import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Star, MapPin, Phone, ThumbsUp, ThumbsDown, Chair, Users, Volume2, Power } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { SeatReviewDialog } from '@/components/seat/SeatReviewDialog';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface Seat {
  id: number;
  type: string;
  capacity: number;
  comfortRating: string;
  hasPowerOutlet: boolean;
  noiseLevel?: string;
  description?: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  images: Array<{
    id: number;
    imageUrl: string;
    width?: number;
    height?: number;
  }>;
  user: {
    username: string;
  };
}

export default function EstablishmentDetails() {
  const { yelpId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: establishment, isLoading: isLoadingEstablishment } = useQuery({
    queryKey: [`/api/establishments/${yelpId}`],
    enabled: !!yelpId,
  });

  const { data: seats = [], isLoading: isLoadingSeats } = useQuery({
    queryKey: [`/api/establishments/${yelpId}/seats`],
    enabled: !!yelpId,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ seatId, voteType }: { seatId: number; voteType: 'upvote' | 'downvote' }) => {
      const response = await fetch(`/api/establishments/${yelpId}/seats/${seatId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/establishments/${yelpId}/seats`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleVote = (seatId: number, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to vote on reviews',
        variant: 'default',
      });
      return;
    }

    voteMutation.mutate({ seatId, voteType });
  };

  if (isLoadingEstablishment || isLoadingSeats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Establishment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">Oshiri</h1>
              <MainNav />
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Establishment Info */}
      <section className="bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{establishment.name}</h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>
                {establishment.location.address1}, {establishment.location.city}
              </span>
            </div>
            {establishment.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{establishment.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{establishment.rating}/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seats Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Seats & Reviews</h2>
          {user ? (
            <SeatReviewDialog establishmentId={yelpId} />
          ) : (
            <Card className="p-4 bg-primary/5 border-primary/10">
              <p className="text-sm text-muted-foreground">
                <Link href="/auth">
                  <Button variant="link" className="p-0 h-auto">Sign in</Button>
                </Link>{" "}to add your seat review and help others find the perfect spot!
              </p>
            </Card>
          )}
        </div>

        {seats.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No seat reviews yet. {user ? "Be the first to add one! 🪑" : "Sign in to add the first review! 🪑"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seats.map((seat: Seat) => (
              <Card key={seat.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Chair className="h-5 w-5" />
                        <h3 className="font-semibold capitalize">{seat.type}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added by {seat.user.username}
                      </p>
                    </div>
                    <div className="text-sm">
                      {new Date(seat.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {seat.images && seat.images.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {seat.images.map((image) => (
                        <img
                          key={image.id}
                          src={image.imageUrl}
                          alt="Seat"
                          className="rounded-md w-full h-32 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="font-medium">Comfort:</span>
                      <span className="text-muted-foreground">{seat.comfortRating}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Capacity:</span>
                      <span className="text-muted-foreground">
                        {seat.capacity} {seat.capacity === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Power className="h-4 w-4" />
                      <span className="font-medium">Power Outlet:</span>
                      <span className="text-muted-foreground">
                        {seat.hasPowerOutlet ? "✅ Available" : "❌ Not available"}
                      </span>
                    </div>
                    {seat.noiseLevel && (
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <span className="font-medium">Noise Level:</span>
                        <span className="text-muted-foreground">{seat.noiseLevel}</span>
                      </div>
                    )}
                    {seat.description && (
                      <p className="text-sm mt-2">{seat.description}</p>
                    )}

                    {/* Voting Section */}
                    <div className="flex items-center gap-4 pt-4 border-t mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleVote(seat.id, 'upvote')}
                        disabled={voteMutation.isPending}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{seat.upvotes}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleVote(seat.id, 'downvote')}
                        disabled={voteMutation.isPending}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{seat.downvotes}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}