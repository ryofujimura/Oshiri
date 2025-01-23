import { AuthButton } from '@/components/auth/AuthButton';
import { MainNav } from '@/components/layout/MainNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation, Link } from 'wouter';
import { Search, MapPin, Star, Power, Volume2, Sofa, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

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

const MotionCard = motion(Card);
const MotionButton = motion(Button);

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: recentReviews } = useQuery({
    queryKey: ['/api/reviews/recent'],
  });

  const getDisplayedReviews = (reviews: Review[] = []) => {
    return reviews.slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
                  Oshiri
                </a>
              </Link>
              <MainNav />
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-32 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Find Your Perfect Seat
              </h1>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Discover and rate the most comfortable seats in cafes and restaurants.
                Because great experiences start with where you sit!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <MotionButton
                  variant="outline"
                  className="group relative overflow-hidden h-auto py-8 px-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation('/search')}
                >
                  <div className="absolute inset-0 bg-primary/5 transform group-hover:scale-105 transition-transform duration-300" />
                  <div className="relative flex flex-col items-center gap-4">
                    <Search className="w-8 h-8 text-primary" />
                    <div className="text-center">
                      <div className="font-semibold text-lg mb-1">Search</div>
                      <div className="text-sm text-muted-foreground">Find your perfect spot</div>
                    </div>
                  </div>
                </MotionButton>

                <MotionButton
                  variant="outline"
                  className="group relative overflow-hidden h-auto py-8 px-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation('/near-me')}
                >
                  <div className="absolute inset-0 bg-primary/5 transform group-hover:scale-105 transition-transform duration-300" />
                  <div className="relative flex flex-col items-center gap-4">
                    <MapPin className="w-8 h-8 text-primary" />
                    <div className="text-center">
                      <div className="font-semibold text-lg mb-1">Near Me</div>
                      <div className="text-sm text-muted-foreground">Discover local gems</div>
                    </div>
                  </div>
                </MotionButton>

                <MotionButton
                  variant="outline"
                  className="group relative overflow-hidden h-auto py-8 px-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation('/top-rated')}
                >
                  <div className="absolute inset-0 bg-primary/5 transform group-hover:scale-105 transition-transform duration-300" />
                  <div className="relative flex flex-col items-center gap-4">
                    <Star className="w-8 h-8 text-primary" />
                    <div className="text-center">
                      <div className="font-semibold text-lg mb-1">Top Rated</div>
                      <div className="text-sm text-muted-foreground">Best seating experiences</div>
                    </div>
                  </div>
                </MotionButton>
              </div>
            </motion.div>
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
          </div>
        </section>

        {recentReviews && recentReviews.length > 0 && (
          <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center mb-12"
              >
                <h2 className="text-3xl font-bold">Recent Reviews</h2>
                {recentReviews.length > 6 && (
                  <Button
                    variant="ghost"
                    onClick={() => setLocation('/reviews')}
                    className="text-sm group"
                  >
                    View All
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                )}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getDisplayedReviews(recentReviews).map((review: Review, index: number) => (
                  <MotionCard
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                    onClick={() => setLocation(`/establishments/${review.establishment.yelpId}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <Sofa className="h-5 w-5" />
                        </div>
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {review.establishment.name}
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm flex items-center gap-2">
                          <span className="font-medium">Seat Type:</span>
                          <span className="text-muted-foreground capitalize">{review.type}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="font-medium">Comfort:</span>
                          <span className="text-muted-foreground">{review.comfortRating}</span>
                        </p>
                        <p className="text-sm text-muted-foreground pt-2 border-t">
                          Reviewed by {review.user.username} • {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </MotionCard>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-24 bg-primary/5 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              Why Choose Oshiri?
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Sofa className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    Detailed Reviews
                  </h3>
                  <p className="text-muted-foreground">
                    Get comprehensive insights about seating comfort, power outlets,
                    and noise levels. Make informed decisions!
                  </p>
                </CardContent>
              </MotionCard>

              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    Location-Based
                  </h3>
                  <p className="text-muted-foreground">
                    Find the perfect spot near you with our location-based search.
                    Discover hidden gems in your area!
                  </p>
                </CardContent>
              </MotionCard>

              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    Community Driven
                  </h3>
                  <p className="text-muted-foreground">
                    Join our community of reviewers. Share experiences and help
                    others find their ideal seating!
                  </p>
                </CardContent>
              </MotionCard>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-6">Ready to Find Your Perfect Seat?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join our growing community and start discovering comfortable spaces
                that match your needs. Share your experiences and help others!
              </p>
              <MotionButton
                size="lg"
                onClick={() => setLocation('/search')}
                className="gap-2 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Exploring
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </MotionButton>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}