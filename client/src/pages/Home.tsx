import { AuthButton } from '@/components/auth/AuthButton';
import { MainNav } from '@/components/layout/MainNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation, Link } from 'wouter';
import { Search, MapPin, Star, Sofa, Users, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FloatingActionMenu } from "@/components/ui/floating-action-menu";
import { Plus, MapPin as MapPinIcon, Star as StarIcon, Search as SearchIcon } from "lucide-react";
import { YelpImageCarousel } from "@/components/establishment/YelpImageCarousel";

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
    photos?: string[];
  };
  createdAt: string;
}

const MotionCard = motion(Card);
const MotionButton = motion(Button);

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40
};

export default function Home() {
  const [, setLocation] = useLocation();

  const { data: recentReviews } = useQuery({
    queryKey: ['/api/reviews/recent'],
  });

  const getDisplayedReviews = (reviews: Review[] = []) => {
    return reviews.slice(0, 6);
  };

  const actionMenuItems = [
    {
      icon: <SearchIcon className="h-5 w-5" />,
      label: "Search Places",
      onClick: () => setLocation("/search")
    },
    {
      icon: <MapPinIcon className="h-5 w-5" />,
      label: "Near Me",
      onClick: () => setLocation("/near-me")
    },
    {
      icon: <StarIcon className="h-5 w-5" />,
      label: "Top Rated",
      onClick: () => setLocation("/top-rated")
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200/80 sticky top-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-2xl font-medium hover:opacity-80 transition-opacity">
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
        <section className="py-40 relative">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-6xl font-medium mb-6 tracking-tight">
                Find Your Perfect Seat
              </h1>
              <p className="text-xl text-gray-600 mb-16 leading-relaxed max-w-2xl mx-auto">
                Discover and rate the most comfortable seats in cafes and restaurants.
                Because great experiences start with where you sit.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MotionButton
                  variant="outline"
                  className="h-auto py-8 px-6 border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springTransition}
                  onClick={() => setLocation('/search')}
                >
                  <div className="flex flex-col items-center gap-4">
                    <Search className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-medium text-lg mb-1">Search</div>
                      <div className="text-sm text-gray-600">Find your perfect spot</div>
                    </div>
                  </div>
                </MotionButton>

                <MotionButton
                  variant="outline"
                  className="h-auto py-8 px-6 border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springTransition}
                  onClick={() => setLocation('/near-me')}
                >
                  <div className="flex flex-col items-center gap-4">
                    <MapPin className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-medium text-lg mb-1">Near Me</div>
                      <div className="text-sm text-gray-600">Discover local gems</div>
                    </div>
                  </div>
                </MotionButton>

                <MotionButton
                  variant="outline"
                  className="h-auto py-8 px-6 border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springTransition}
                  onClick={() => setLocation('/top-rated')}
                >
                  <div className="flex flex-col items-center gap-4">
                    <Star className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-medium text-lg mb-1">Top Rated</div>
                      <div className="text-sm text-gray-600">Best seating experiences</div>
                    </div>
                  </div>
                </MotionButton>
              </div>
            </motion.div>
          </div>
        </section>

        {recentReviews && recentReviews.length > 0 && (
          <section className="py-32 bg-gray-50">
            <div className="container mx-auto px-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={springTransition}
                className="max-w-4xl mx-auto"
              >
                <h2 className="text-4xl font-medium text-center mb-16">Recent Reviews</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {getDisplayedReviews(recentReviews).map((review: Review) => (
                    <MotionCard
                      key={review.id}
                      className="bg-white border border-gray-200 hover:border-gray-300"
                      whileHover={{ y: -4 }}
                      transition={springTransition}
                      onClick={() => setLocation(`/establishments/${review.establishment.yelpId}`)}
                    >
                      <CardContent className="p-6">
                        {review.establishment.photos && review.establishment.photos.length > 0 && (
                          <div className="mb-4">
                            <YelpImageCarousel 
                              photos={review.establishment.photos} 
                              aspectRatio={4/3}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <Sofa className="h-5 w-5" />
                          </div>
                          <h4 className="font-medium">
                            {review.establishment.name}
                          </h4>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm flex items-center gap-2">
                            <span className="font-medium">Type:</span>
                            <span className="text-gray-600 capitalize">{review.type}</span>
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <span className="font-medium">Comfort:</span>
                            <span className="text-gray-600">{review.comfortRating}</span>
                          </p>
                          <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">
                            By {review.user.username} • {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </MotionCard>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        <section className="py-32 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springTransition}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl font-medium text-center mb-16">Why Choose Oshiri?</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MotionCard
                  className="border border-gray-200 hover:border-gray-300"
                  whileHover={{ y: -4 }}
                  transition={springTransition}
                >
                  <CardContent className="p-6">
                    <div className="p-3 rounded-lg bg-gray-100 w-fit mb-4">
                      <Sofa className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      Detailed Reviews
                    </h3>
                    <p className="text-gray-600">
                      Get comprehensive insights about seating comfort, power outlets,
                      and noise levels. Make informed decisions.
                    </p>
                  </CardContent>
                </MotionCard>

                <MotionCard
                  className="border border-gray-200 hover:border-gray-300"
                  whileHover={{ y: -4 }}
                  transition={springTransition}
                >
                  <CardContent className="p-6">
                    <div className="p-3 rounded-lg bg-gray-100 w-fit mb-4">
                      <MapPin className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      Location-Based
                    </h3>
                    <p className="text-gray-600">
                      Find the perfect spot near you with our location-based search.
                      Discover hidden gems in your area.
                    </p>
                  </CardContent>
                </MotionCard>

                <MotionCard
                  className="border border-gray-200 hover:border-gray-300"
                  whileHover={{ y: -4 }}
                  transition={springTransition}
                >
                  <CardContent className="p-6">
                    <div className="p-3 rounded-lg bg-gray-100 w-fit mb-4">
                      <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      Community Driven
                    </h3>
                    <p className="text-gray-600">
                      Join our community of reviewers. Share experiences and help
                      others find their ideal seating.
                    </p>
                  </CardContent>
                </MotionCard>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-32 bg-[#101010] text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={springTransition}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-4xl font-medium mb-6">Ready to Find Your Perfect Seat?</h2>
              <p className="text-xl text-gray-400 mb-10">
                Join our growing community and start discovering comfortable spaces
                that match your needs.
              </p>
              <MotionButton
                size="lg"
                className="bg-white text-black hover:bg-gray-100"
                onClick={() => setLocation('/search')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
              >
                Start Exploring
                <ArrowRight className="ml-2 h-5 w-5" />
              </MotionButton>
            </motion.div>
          </div>
        </section>
      </main>
      <FloatingActionMenu items={actionMenuItems} />
    </div>
  );
}