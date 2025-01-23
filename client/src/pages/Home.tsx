import { AuthButton } from '@/components/auth/AuthButton';
import { EstablishmentGrid } from '@/components/establishment/EstablishmentGrid';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user } = useAuth();

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

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to Oshiri</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Your guide to the most comfortable seats in cafes and restaurants.
            Find the perfect spot that will save your... comfort!
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Nearby Establishments</h3>
          <EstablishmentGrid />
        </div>
      </main>
    </div>
  );
}