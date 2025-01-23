import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export function FeedbackButton() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit feedback.',
        variant: 'default',
      });
      return;
    }
    setLocation('/feedback');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed bottom-6 right-6 shadow-md"
      onClick={handleClick}
    >
      <MessageSquarePlus className="h-4 w-4 mr-2" />
      Feedback
    </Button>
  );
}