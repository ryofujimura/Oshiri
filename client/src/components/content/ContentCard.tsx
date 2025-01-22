import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Trash, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Content {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  userId: number;
  upvotes: number;
  downvotes: number;
}

interface ContentCardProps {
  content: Content;
  onEdit?: (content: Content) => void;
}

export function ContentCard({ content, onEdit }: ContentCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vote = useMutation({
    mutationFn: async ({ type }: { type: 'up' | 'down' }) => {
      const response = await fetch(`/api/contents/${content.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contents'] });
      toast({
        title: "Success",
        description: "Vote updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteContent = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/contents/${content.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contents'] });
      toast({
        title: "Success",
        description: "Content deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
            onClick={() => vote.mutate({ type: 'up' })}
            disabled={!user}
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            {content.upvotes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => vote.mutate({ type: 'down' })}
            disabled={!user}
          >
            <ThumbsDown className="w-4 h-4 mr-1" />
            {content.downvotes}
          </Button>
        </div>
        {user?.role === 'admin' && (
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
              onClick={() => deleteContent.mutate()}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}