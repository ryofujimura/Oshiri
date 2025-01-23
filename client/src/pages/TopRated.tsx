import { useQuery } from '@tanstack/react-query';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import { EstablishmentGrid } from '@/components/establishment/EstablishmentGrid';

export default function TopRated() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-2xl font-bold hover:text-primary transition-colors">
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
        <section className="py-12 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Top Rated Restaurants</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Discover the highest-rated dining spots based on user reviews and seating comfort. 
              These establishments have been recognized by our community for their exceptional 
              seating arrangements and overall dining experience.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <EstablishmentGrid searchParams={{ sort: 'rating' }} />
        </section>
      </main>
    </div>
  );
}