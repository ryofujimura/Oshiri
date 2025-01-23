import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PenSquare, Trash2, Eye } from 'lucide-react';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { Link } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';

interface EditFormData {
  type: string;
  capacity: number;
  comfortRating: string;
  hasPowerOutlet: boolean;
  noiseLevel: string;
  description: string;
}

interface Seat {
  id: number;
  type: string;
  capacity: number;
  comfortRating: string;
  hasPowerOutlet: boolean;
  noiseLevel?: string;
  description?: string;
  establishment: {
    name: string;
  };
  user: {
    username: string;
  };
  createdAt: string;
}

interface EditRequest {
  id: number;
  seat: Seat;
  type?: string;
  capacity?: number;
  comfortRating?: string;
  hasPowerOutlet?: boolean;
  noiseLevel?: string;
  description?: string;
  requestType: 'edit' | 'delete';
  status: string;
  user: {
    username: string;
  };
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<Seat | EditRequest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<EditFormData>();

  // Query for reviews - if admin, gets all reviews, otherwise just user's reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/users/reviews'],
    enabled: !!user,
  });

  // Query for edit requests - admin only
  const { data: editRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/users/edit-requests'],
    enabled: !!user && user.role === 'admin',
  });

  // Mutation for handling review edits/deletes
  const editReviewMutation = useMutation({
    mutationFn: async ({ reviewId, type, data }: { reviewId: number, type: 'edit' | 'delete', data?: any }) => {
      const response = await fetch(`/api/seats/${reviewId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, ...data }),
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
        description: user?.role === 'admin' ? 'Review updated successfully' : 'Edit request submitted successfully',
      });
      setIsEditDialogOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users/reviews'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for handling admin actions on edit requests
  const handleAdminActionMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number, action: 'approve' | 'reject' }) => {
      const response = await fetch(`/api/edit-requests/${requestId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (_, { action }) => {
      toast({
        title: 'Success',
        description: `Request ${action}ed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/edit-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onEditSubmit = async (data: EditFormData) => {
    if (!selectedReview) return;

    editReviewMutation.mutate({
      reviewId: ('seat' in selectedReview) ? selectedReview.seat.id : selectedReview.id,
      type: 'edit',
      data,
    });
  };

  const handleDelete = async (reviewId: number) => {
    editReviewMutation.mutate({
      reviewId,
      type: 'delete',
    });
  };

  if (!user) {
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
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Please log in to view your profile.</p>
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Welcome back, {user.username}!
              {user.role === 'admin' && ' (Admin)'}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="reviews">
          <TabsList>
            <TabsTrigger value="reviews">
              {user.role === 'admin' ? 'All Reviews' : 'My Reviews'}
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="requests">Edit Requests</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reviews">
            <div className="grid gap-4">
              {isLoadingReviews ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !reviews?.length ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No reviews found.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews?.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{review.establishment.name}</CardTitle>
                          <CardDescription>
                            {user.role === 'admin' && `By ${review.user.username} • `}
                            Posted on {format(new Date(review.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedReview(review);
                              setIsEditDialogOpen(true);
                              reset(review);
                            }}
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Seat Type:</strong> {review.type}</p>
                        <p><strong>Comfort:</strong> {review.comfortRating}</p>
                        <p><strong>Power Outlet:</strong> {review.hasPowerOutlet ? 'Yes' : 'No'}</p>
                        <p><strong>Noise Level:</strong> {review.noiseLevel}</p>
                        <p><strong>Description:</strong> {review.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="requests">
              <div className="grid gap-4">
                {isLoadingRequests ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !editRequests?.length ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        No pending edit requests.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  editRequests?.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              {request.requestType === 'edit' ? 'Edit' : 'Delete'} Request
                            </CardTitle>
                            <CardDescription>
                              By {request.user.username} for review at {request.seat.establishment.name}
                              <br />
                              Submitted on {format(new Date(request.createdAt), 'MMM d, yyyy')}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {request.requestType === 'edit' && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedReview(request);
                                  setIsPreviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="default"
                              onClick={() => handleAdminActionMutation.mutate({
                                requestId: request.id,
                                action: 'approve'
                              })}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleAdminActionMutation.mutate({
                                requestId: request.id,
                                action: 'reject'
                              })}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {request.requestType === 'edit' && (
                        <CardContent>
                          <div className="space-y-2">
                            <p><strong>Changes requested:</strong></p>
                            {request.type && (
                              <p><strong>Type:</strong> {request.type}</p>
                            )}
                            {request.comfortRating && (
                              <p><strong>Comfort Rating:</strong> {request.comfortRating}</p>
                            )}
                            {request.hasPowerOutlet !== null && (
                              <p><strong>Power Outlet:</strong> {request.hasPowerOutlet ? 'Yes' : 'No'}</p>
                            )}
                            {request.noiseLevel && (
                              <p><strong>Noise Level:</strong> {request.noiseLevel}</p>
                            )}
                            {request.description && (
                              <p><strong>Description:</strong> {request.description}</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Seat Type</Label>
                <Input id="type" {...register('type')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comfortRating">Comfort Rating</Label>
                <Input id="comfortRating" {...register('comfortRating')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noiseLevel">Noise Level</Label>
                <Input id="noiseLevel" {...register('noiseLevel')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} />
              </div>
              <DialogFooter>
                <Button type="submit">
                  {user.role === 'admin' ? 'Save Changes' : 'Submit for Review'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preview Changes</DialogTitle>
            </DialogHeader>
            {selectedReview && 'seat' in selectedReview && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p><strong>Original Review:</strong></p>
                  <Card>
                    <CardContent className="pt-4">
                      <p><strong>Type:</strong> {selectedReview.seat.type}</p>
                      <p><strong>Comfort:</strong> {selectedReview.seat.comfortRating}</p>
                      <p><strong>Noise Level:</strong> {selectedReview.seat.noiseLevel}</p>
                      <p><strong>Description:</strong> {selectedReview.seat.description}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-2">
                  <p><strong>Proposed Changes:</strong></p>
                  <Card>
                    <CardContent className="pt-4">
                      <p><strong>Type:</strong> {selectedReview.type || selectedReview.seat.type}</p>
                      <p><strong>Comfort:</strong> {selectedReview.comfortRating || selectedReview.seat.comfortRating}</p>
                      <p><strong>Noise Level:</strong> {selectedReview.noiseLevel || selectedReview.seat.noiseLevel}</p>
                      <p><strong>Description:</strong> {selectedReview.description || selectedReview.seat.description}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}