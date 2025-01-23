import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FormData {
  title: string;
  description: string;
  images?: FileList;
  categories: string[];
}

export function ContentForm() {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const createContent = useMutation({
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

      const response = await fetch('/api/contents', {
        method: 'POST',
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
        description: "Content created successfully"
      });
      reset();
      setSelectedCategories([]);
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
    createContent.mutate(data);
  };

  return (
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
            {categories.map((category) => (
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
              const category = categories.find(c => c.id.toString() === categoryId);
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
        <Label htmlFor="images">Images (Up to 5)</Label>
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

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Content'}
      </Button>
    </form>
  );
}