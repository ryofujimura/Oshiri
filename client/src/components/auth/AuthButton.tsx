import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export function AuthButton() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      toast({
        title: "Welcome!",
        description: "Successfully signed in."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Goodbye!",
        description: "Successfully signed out."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={user ? handleSignOut : handleSignIn}
      variant="outline"
    >
      {user ? 'Sign Out' : 'Sign In'}
    </Button>
  );
}
