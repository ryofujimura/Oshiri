import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Trash, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Image {
  id: number;
  imageUrl: string;
  contentId: number;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

interface Content {
  id: number;
  title: string;
  description: string;
  images: Image[];
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

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

  const nextImage = () => {
    if (!content.images || content.images.length <= 1) return;
    setCurrentImageIndex((prev) => 
      prev === content.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    if (!content.images || content.images.length <= 1) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? content.images.length - 1 : prev - 1
    );
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">{content.title}</h3>
      </CardHeader>
      <CardContent>
        {content.images && content.images.length > 0 && (
          <div className="relative mb-4">
            {!imageError[currentImageIndex] && (
              <img 
                src={content.images[currentImageIndex].imageUrl} 
                alt={`${content.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-48 object-cover rounded-md"
                onError={() => handleImageError(currentImageIndex)}
              />
            )}
            {content.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={previousImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {content.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
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