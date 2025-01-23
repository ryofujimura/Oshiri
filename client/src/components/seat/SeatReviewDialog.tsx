import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';

// Update schema to make most fields optional
const seatReviewSchema = z.object({
  type: z.string().min(1, 'Please select a seat type'),
  capacity: z.coerce.number().optional(),
  comfortRating: z.string().optional(),
  hasPowerOutlet: z.boolean().optional().default(false),
  noiseLevel: z.string().optional(),
  description: z.string().optional(),
});

type SeatReview = z.infer<typeof seatReviewSchema>;

interface Props {
  establishmentId: string;
  trigger?: React.ReactNode;
}

export function SeatReviewDialog({ establishmentId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SeatReview>({
    resolver: zodResolver(seatReviewSchema),
    defaultValues: {
      hasPowerOutlet: false,
      capacity: 1,
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (selectedFiles.length + newFiles.length > 5) {
        toast({
          title: "Error",
          description: "You can only upload up to 5 images",
          variant: "destructive",
        });
        return;
      }

      setSelectedFiles(prev => [...prev, ...newFiles]);

      // Create preview URLs
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    // Revoke the old preview URL to free up memory
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addReviewMutation = useMutation({
    mutationFn: async (data: SeatReview) => {
      const formData = new FormData();

      // Append review data with proper type conversion
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Append images
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/establishments/${establishmentId}/seats`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/establishments/${establishmentId}/seats`] });
      toast({
        title: 'Success',
        description: data.message || 'Your review has been added successfully',
      });
      setOpen(false);
      form.reset();
      setSelectedFiles([]);
      setPreviewUrls([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SeatReview) => {
    addReviewMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Seat Review</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Seat Review</DialogTitle>
          <DialogDescription>
            Share your experience about the seating at this establishment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a seat type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="chair">Chair</SelectItem>
                      <SelectItem value="sofa">Sofa</SelectItem>
                      <SelectItem value="bench">Bench</SelectItem>
                      <SelectItem value="stool">Stool</SelectItem>
                      <SelectItem value="booth">Booth</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comfortRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comfort Rating</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select comfort level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Comfortable">Comfortable</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Torn">Torn/Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noiseLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Noise Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select noise level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Quiet">Quiet</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Loud">Loud</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasPowerOutlet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Power Outlet Available</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share more details about your experience..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Images</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {selectedFiles.length < 5 && (
                  <div className="relative w-full h-24">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload up to 5 images of the seating area
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={addReviewMutation.isPending}
            >
              {addReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}