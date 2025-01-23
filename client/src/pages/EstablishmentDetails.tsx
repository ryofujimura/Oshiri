import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { SeatReviewDialog } from '@/components/seat/SeatReviewDialog';
import { SeatImageCarousel } from '@/components/seat/SeatImageCarousel';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  isVisible: boolean;
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

  // Add visibility toggle mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ seatId, isVisible }: { seatId: number; isVisible: boolean }) => {
      const response = await fetch(`/api/establishments/${yelpId}/seats/${seatId}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/establishments/${yelpId}/seats`] });
      toast({
        title: 'Success',
        description: 'Review visibility updated successfully',
      });
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

  // Sort seats by relevance (upvotes ratio) and filter hidden reviews
  const sortedSeats = [...seats]
    .filter((seat: Seat) => seat.isVisible) // Filter out hidden reviews
    .sort((a, b) => {
      const getRelevanceScore = (seat: Seat) => {
        const totalVotes = seat.upvotes + seat.downvotes;
        if (totalVotes === 0) return 0;
        return (seat.upvotes / totalVotes) * Math.log10(totalVotes + 1);
      };
      return getRelevanceScore(b) - getRelevanceScore(a);
    });

  const renderReviews = () => {
    if (isLoadingSeats) {
      return (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (!sortedSeats.length) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No seat reviews yet. {user ? "Be the first to add one! 🪑" : "Sign in to add the first review! 🪑"}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSeats.map((seat: Seat) => (
          <Card
            key={seat.id}
            className={cn(
              'transition-opacity duration-200',
              !seat.isVisible && 'opacity-60'
            )}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    🪑
                    <h3 className="font-semibold capitalize">{seat.type}</h3>
                    {!seat.isVisible && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Added by {seat.user.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    {new Date(seat.createdAt).toLocaleDateString()}
                  </div>
                  {user?.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibilityMutation.mutate({
                        seatId: seat.id,
                        isVisible: !seat.isVisible
                      })}
                      disabled={toggleVisibilityMutation.isPending}
                    >
                      {seat.isVisible ? 'Hide' : 'Show'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {seat.images && seat.images.length > 0 && (
                <div className="mb-4">
                  <SeatImageCarousel images={seat.images} />
                </div>
              )}
              <div className="space-y-2">
                {seat.capacity && (
                  <div className="flex items-center gap-2">
                    👥
                    <span className="font-medium">Capacity:</span>
                    <span className="text-muted-foreground">
                      {seat.capacity} {seat.capacity === 1 ? "person" : "people"}
                    </span>
                  </div>
                )}
                {seat.comfortRating && (
                  <div className="flex items-center gap-2">
                    ⭐
                    <span className="font-medium">Comfort:</span>
                    <span className="text-muted-foreground">{seat.comfortRating}</span>
                  </div>
                )}
                {seat.hasPowerOutlet && (
                  <div className="flex items-center gap-2">
                    🔌
                    <span className="font-medium">Power Outlet:</span>
                    <span className="text-muted-foreground">
                      {seat.hasPowerOutlet ? "✅ Available" : "❌ Not available"}
                    </span>
                  </div>
                )}
                {seat.noiseLevel && (
                  <div className="flex items-center gap-2">
                    🔊
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
                    👍
                    <span>{seat.upvotes}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleVote(seat.id, 'downvote')}
                    disabled={voteMutation.isPending}
                  >
                    👎
                    <span>{seat.downvotes}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoadingEstablishment || isLoadingSeats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-xl">⌛</div>
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
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-2xl font-bold hover:text-primary transition-colors">
                  Oshiri
                </a>
              </Link>
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
              📍
              <span>
                {establishment.location?.address1}, {establishment.location?.city}
              </span>
            </div>
            {establishment.phone && (
              <div className="flex items-center gap-1">
                📞
                <span>{establishment.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              ⭐
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
                Please
                <span className="text-primary/50 font-medium mx-1">sign in</span>
                to add your seat review and help others find the perfect spot!
              </p>
            </Card>
          )}
        </div>

        {renderReviews()}
      </main>
    </div>
  );
}