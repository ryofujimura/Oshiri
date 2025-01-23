import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface FormData {
  title: string;
  description: string;
  images?: FileList;
  categories: string[];
}

interface ContentDialogProps {
  content?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentDialog({ content, open, onOpenChange }: ContentDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: content ? {
      title: content.title,
      description: content.description,
      categories: content.categories?.map((c: any) => c.category.id.toString()) || []
    } : {
      title: '',
      description: '',
      categories: []
    }
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form and selected categories when content changes
  useEffect(() => {
    if (content) {
      reset({
        title: content.title,
        description: content.description,
      });
      setSelectedCategories(content.categories?.map((c: any) => c.category.id.toString()) || []);
    } else {
      reset({
        title: '',
        description: '',
      });
      setSelectedCategories([]);
    }
  }, [content, reset]);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('categories', JSON.stringify(selectedCategories));

      if (data.images) {
        Array.from(data.images).forEach((file) => {
          formData.append('images', file);
        });
      }

      const url = content ? `/api/contents/${content.id}` : '/api/contents';
      const method = content ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
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
        description: content ? "Content updated successfully" : "Content created successfully"
      });
      reset();
      setSelectedCategories([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {content ? 'Edit Content' : 'Create Content'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: true })}
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: true })}
              placeholder="Enter description"
            />
          </div>

          <div>
            <Label htmlFor="categories">Categories</Label>
            <Select
              onValueChange={(value) => {
                const category = value;
                setSelectedCategories(prev => 
                  prev.includes(category)
                    ? prev.filter(c => c !== category)
                    : [...prev, category]
                );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category: any) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id.toString()}
                    className={selectedCategories.includes(category.id.toString()) ? 'bg-accent' : ''}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find((c: any) => c.id.toString() === categoryId);
                  return (
                    <div 
                      key={categoryId}
                      className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {category?.name}
                      <button
                        type="button"
                        onClick={() => setSelectedCategories(prev => prev.filter(id => id !== categoryId))}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="images">Add More Images</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              {...register('images')}
            />
            <p className="text-sm text-muted-foreground mt-1">
              You can select up to 5 images
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (content ? 'Updating...' : 'Creating...') : (content ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}