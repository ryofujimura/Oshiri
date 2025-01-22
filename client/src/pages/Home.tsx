import { useState } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';
import { ContentGrid } from '@/components/content/ContentGrid';
import { ContentForm } from '@/components/content/ContentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { Plus } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Content Platform</h1>
          <div className="flex items-center gap-4">
            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <ContentForm />
                </DialogContent>
              </Dialog>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ContentGrid />
      </main>
    </div>
  );
}