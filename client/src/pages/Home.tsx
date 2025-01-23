import { AuthButton } from '@/components/auth/AuthButton';
import { EstablishmentGrid } from '@/components/establishment/EstablishmentGrid';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Oshiri</h1>
          <div className="flex items-center gap-4">
            <AuthButton />
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 to-primary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Find Your Perfect Seat
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Discover and rate the most comfortable seats in cafes and restaurants.
                Because great experiences start with where you sit!
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search restaurants or cafes..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Location"
                    className="pl-10"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Establishments Grid */}
        <section className="container mx-auto px-4 py-12">
          <h3 className="text-2xl font-semibold mb-6">
            {isSearching ? 'Search Results' : 'Nearby Establishments'}
          </h3>
          <EstablishmentGrid searchParams={isSearching ? { term: searchTerm, location } : undefined} />
        </section>
      </main>
    </div>
  );
}