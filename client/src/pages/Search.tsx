import { useState } from 'react';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import { EstablishmentGrid } from '@/components/establishment/EstablishmentGrid';
import { Link } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useState<{ term?: string; location?: string } | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setSearchParams({
      term: searchTerm.trim() || undefined,
      location: location.trim() || undefined
    });
    setIsSearching(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                  Osiri
                </a>
              </Link>
              <MainNav />
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main>
        <section className="py-12 bg-accent">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Search Restaurants</h2>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-2xl">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                  placeholder="Enter location (or allow location access)"
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label="Location"
                />
              </div>
              <Button type="submit" className="md:w-auto">Search</Button>
            </form>
            {error && (
              <Alert variant="destructive" className="mt-4 max-w-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Note: If no location is provided, we'll try to use your current location
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <EstablishmentGrid searchParams={searchParams} />
        </section>
      </main>
    </div>
  );
}