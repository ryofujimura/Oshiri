import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthStore } from '@/lib/store';

interface FormData {
  title: string;
  description: string;
  image?: FileList;
}

export function ContentForm() {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = '';
      if (data.image?.[0]) {
        const imageRef = ref(storage, `content/${Date.now()}_${data.image[0].name}`);
        await uploadBytes(imageRef, data.image[0]);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'contents'), {
        title: data.title,
        description: data.description,
        imageUrl,
        createdBy: user.uid,
        createdAt: new Date(),
        votes: {
          upvotes: [],
          downvotes: []
        }
      });

      toast({
        title: "Success",
        description: "Content created successfully"
      });
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        <Label htmlFor="image">Image</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          {...register('image')}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Content'}
      </Button>
    </form>
  );
}
