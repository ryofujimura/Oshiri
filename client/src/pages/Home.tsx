import { AuthButton } from '@/components/auth/AuthButton';
import { MainNav } from '@/components/layout/MainNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { Search, MapPin, Star, Power, Volume2, Sofa, Users, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Review {
  id: number;
  type: string;
  comfortRating: string;
  user: {
    username: string;
  };
  establishment: {
    name: string;
    yelpId: string;
  };
  createdAt: string;
}

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: recentReviews } = useQuery({
    queryKey: ['/api/reviews/recent'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/recent');
      if (!response.ok) throw new Error('Failed to fetch recent reviews');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
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

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 to-primary/5 py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Find Your Perfect Seat
              </h2>
              <p className="text-xl text-muted-foreground mb-12">
                Discover and rate the most comfortable seats in cafes and restaurants.
                Because great experiences start with where you sit!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto py-6 px-4"
                  onClick={() => setLocation('/search')}
                >
                  <Search className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Search</div>
                    <div className="text-sm text-muted-foreground">Find your perfect spot</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto py-6 px-4"
                  onClick={() => setLocation('/near-me')}
                >
                  <MapPin className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Near Me</div>
                    <div className="text-sm text-muted-foreground">Discover local gems</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto py-6 px-4"
                  onClick={() => setLocation('/top-rated')}
                >
                  <Star className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Top Rated</div>
                    <div className="text-sm text-muted-foreground">Best seating experiences</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Recent Reviews Section */}
        {recentReviews && recentReviews.length > 0 && (
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <h3 className="text-3xl font-bold text-center mb-12">Recent Reviews</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentReviews.map((review: Review) => (
                  <Card key={review.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setLocation(`/establishments/${review.establishment.yelpId}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sofa className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{review.establishment.name}</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Seat Type:</span>{" "}
                          <span className="text-muted-foreground capitalize">{review.type}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Comfort:</span>{" "}
                          <span className="text-muted-foreground">{review.comfortRating}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Reviewed by {review.user.username} • {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-24 bg-primary/5">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">Why Choose Oshiri?</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="relative overflow-hidden group">
                <CardContent className="p-6">
                  <Sofa className="h-8 w-8 mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">Detailed Reviews</h4>
                  <p className="text-muted-foreground">
                    Get comprehensive insights about seating comfort, power outlets,
                    and noise levels. Make informed decisions!
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group">
                <CardContent className="p-6">
                  <MapPin className="h-8 w-8 mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">Location-Based</h4>
                  <p className="text-muted-foreground">
                    Find the perfect spot near you with our location-based search.
                    Discover hidden gems in your area!
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 mb-4 text-primary" />
                  <h4 className="text-xl font-semibold mb-2">Community Driven</h4>
                  <p className="text-muted-foreground">
                    Join our community of reviewers. Share experiences and help
                    others find their ideal seating!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Find Places</h4>
                <p className="text-sm text-muted-foreground">
                  Search for restaurants and cafes near you
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sofa className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Check Reviews</h4>
                <p className="text-sm text-muted-foreground">
                  Read detailed seat reviews from our community
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Share Experience</h4>
                <p className="text-sm text-muted-foreground">
                  Add your own reviews and photos
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Power className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Find Amenities</h4>
                <p className="text-sm text-muted-foreground">
                  Discover places with power outlets and more
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-6">Ready to Find Your Perfect Seat?</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our growing community and start discovering comfortable spaces
              that match your needs. Share your experiences and help others!
            </p>
            <Button 
              size="lg" 
              onClick={() => setLocation('/search')}
              className="gap-2"
            >
              Start Exploring <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}