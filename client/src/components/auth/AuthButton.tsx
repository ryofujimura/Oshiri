import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';

export function AuthButton() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      // Create or update user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        role: 'user', // Default role for new users
        lastLogin: new Date()
      }, { merge: true });

      toast({
        title: "Welcome!",
        description: "Successfully signed in."
      });
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in.",
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
    } catch (error: any) {
      console.error('Sign-out error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={user ? handleSignOut : handleSignIn}
      variant="outline"
    >
      {user ? 'Sign Out' : 'Sign In with Google'}
    </Button>
  );
}