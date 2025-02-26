import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { Link } from 'wouter';

const feedbackSchema = z.object({
  content: z.string().min(1, 'Please enter your feedback'),
  category: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

interface Feedback {
  id: number;
  content: string;
  category: string;
  upvotes: number;
  downvotes: number;
  status: string;
  user: {
    username: string;
  };
  createdAt: string;
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: 'general',
    },
  });

  const { data: feedbackItems = [] } = useQuery({
    queryKey: ['/api/feedback'],
  });

  // Admin mutation for updating feedback status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      toast({
        title: 'Success',
        description: 'Feedback status updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async (data: FeedbackForm) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted successfully.',
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ feedbackId, voteType }: { feedbackId: number; voteType: 'up' | 'down' }) => {
      const response = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voteType }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FeedbackForm) => {
    submitFeedback.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <Link href="/">
                  <a className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                    Osiri
                  </a>
                </Link>
                <MainNav />
              </div>
              <AuthButton />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please log in to submit feedback.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/">
                <a className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                  Osiri
                </a>
              </Link>
              <MainNav />
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription className="text-muted-foreground">
                Share your thoughts, suggestions, or report issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Feedback</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your thoughts, suggestions, or report issues..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={submitFeedback.isPending}>
                    {submitFeedback.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Community Feedback</h2>
            {feedbackItems.map((feedback: Feedback) => (
              <Card key={feedback.id} className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium text-lg text-foreground">{feedback.content}</p>
                      <p className="text-sm text-muted-foreground">
                        By {feedback.user.username} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground mt-2">
                        {feedback.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteMutation.mutate({ feedbackId: feedback.id, voteType: 'up' })}
                        className="hover:bg-primary/10"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {feedback.upvotes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteMutation.mutate({ feedbackId: feedback.id, voteType: 'down' })}
                        className="hover:bg-primary/10"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {feedback.downvotes}
                      </Button>
                    </div>
                  </div>
                  {user.role === 'admin' ? (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Current Status: {feedback.status}</p>
                        <Select
                          defaultValue={feedback.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: feedback.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">In Review</SelectItem>
                            <SelectItem value="in-progress">Working</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="declined">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : feedback.status !== 'pending' && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground">Status: {feedback.status}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}