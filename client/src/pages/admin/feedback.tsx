import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

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

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching all feedback
  const { data: feedbackItems = [], isLoading } = useQuery({
    queryKey: ['/api/admin/feedback'],
    enabled: !!user && user.role === 'admin',
  });

  // Mutation for updating feedback status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: number; status: string }) => {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
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
      toast({
        title: 'Success',
        description: 'Feedback status updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <Link href="/">
                  <a className="text-2xl font-bold hover:text-primary transition-colors">
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
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">You don't have permission to access this page.</p>
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
                <a className="text-2xl font-bold hover:text-primary transition-colors">
                  Oshiri
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
              <CardTitle>Manage Feedback</CardTitle>
              <CardDescription>
                Review and manage user feedback
              </CardDescription>
            </CardHeader>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackItems.map((feedback: Feedback) => (
                <Card key={feedback.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="font-medium text-lg">{feedback.content}</p>
                        <p className="text-sm text-muted-foreground">
                          By {feedback.user.username} • {new Date(feedback.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                            {feedback.category}
                          </span>
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                            👍 {feedback.upvotes}
                          </span>
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                            👎 {feedback.downvotes}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={feedback.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({
                              feedbackId: feedback.id,
                              status: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}