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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const seatReviewSchema = z.object({
  type: z.string().min(1, 'Please select a seat type'),
  capacity: z.coerce.number().optional(),
  comfortRating: z.string().optional(),
  hasPowerOutlet: z.boolean().optional().default(false),
  noiseLevel: z.string().optional(),
  description: z.string().optional(),
});

type SeatReview = z.infer<typeof seatReviewSchema>;

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

  const form = useForm<SeatReview>({
    resolver: zodResolver(seatReviewSchema),
    defaultValues: {
      hasPowerOutlet: false,
      capacity: 1,
    },
  });

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
      form.reset();
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

  const onEditSubmit = async (data: SeatReview) => {
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

  // JSX remains the same until the edit dialog
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
              ) : !reviews.length ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No reviews found.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review: Seat) => (
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
                              form.reset({
                                type: review.type,
                                capacity: review.capacity,
                                comfortRating: review.comfortRating,
                                hasPowerOutlet: review.hasPowerOutlet,
                                noiseLevel: review.noiseLevel,
                                description: review.description,
                              });
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
                ) : !editRequests.length ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        No pending edit requests.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  editRequests.map((request: EditRequest) => (
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
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

                <DialogFooter>
                  <Button type="submit">
                    {editReviewMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      user?.role === 'admin' ? 'Save Changes' : 'Submit for Review'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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