import { AuthButton } from '@/components/auth/AuthButton';
import { MainNav } from '@/components/layout/MainNav';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Search, MapPin, Star } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();

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
      </main>
    </div>
  );
}