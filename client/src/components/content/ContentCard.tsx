import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Trash, Edit } from 'lucide-react';
import { Content } from '@/lib/firebase';
import { useAuthStore } from '@/lib/store';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ContentCardProps {
  content: Content;
  onEdit?: (content: Content) => void;
}

export function ContentCard({ content, onEdit }: ContentCardProps) {
  const { user, role } = useAuthStore();
  const { toast } = useToast();

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) return;

    const contentRef = doc(db, 'contents', content.id);
    const votes = { ...content.votes };

    if (type === 'up') {
      votes.upvotes = votes.upvotes.includes(user.uid)
        ? votes.upvotes.filter(id => id !== user.uid)
        : [...votes.upvotes, user.uid];
      votes.downvotes = votes.downvotes.filter(id => id !== user.uid);
    } else {
      votes.downvotes = votes.downvotes.includes(user.uid)
        ? votes.downvotes.filter(id => id !== user.uid)
        : [...votes.downvotes, user.uid];
      votes.upvotes = votes.upvotes.filter(id => id !== user.uid);
    }

    try {
      await updateDoc(contentRef, { votes });
      toast({
        title: "Success",
        description: "Vote updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'contents', content.id));
      toast({
        title: "Success",
        description: "Content deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">{content.title}</h3>
      </CardHeader>
      <CardContent>
        {content.imageUrl && (
          <img 
            src={content.imageUrl} 
            alt={content.title} 
            className="w-full h-48 object-cover mb-4 rounded-md"
          />
        )}
        <p className="text-sm text-gray-600">{content.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote('up')}
            disabled={!user}
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            {content.votes.upvotes.length}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote('down')}
            disabled={!user}
          >
            <ThumbsDown className="w-4 h-4 mr-1" />
            {content.votes.downvotes.length}
          </Button>
        </div>
        {role === 'admin' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(content)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
