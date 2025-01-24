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
import { Switch } from "@/components/ui/switch";

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
  isVisible: boolean; // Added isVisible field
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

const profileUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

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

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/users/reviews'],
    enabled: !!user,
  });

  const { data: editRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/users/edit-requests'],
    enabled: !!user && user.role === 'admin',
  });

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

  const handleAdminActionMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'approve' | 'reject' }) => {
      const response = await fetch(`/api/seats/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        description: 'Edit request updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/edit-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const profileForm = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: user?.username || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
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
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      if (profileForm.getValues('newPassword')) {
        profileForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onProfileSubmit = async (data: ProfileUpdate) => {
    updateProfileMutation.mutate(data);
  };

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ reviewId, isVisible }: { reviewId: number; isVisible: boolean }) => {
      const response = await fetch(`/api/seats/${reviewId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/reviews'] });
      toast({
        title: 'Success',
        description: 'Review visibility updated successfully',
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
              <p className="text-center text-muted-foreground">Please log in to view your profile.</p>
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
        <Card className="mb-8 bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Welcome back, {user.username}!
              {user.role === 'admin' && ' (Admin)'}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList className="bg-card">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reviews">
              {user.role === 'admin' ? 'All Reviews' : 'My Reviews'}
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="requests">Edit Requests</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="settings">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Profile Settings</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Update your username or change your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password (Optional)</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              disabled={!profileForm.watch('newPassword')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="grid gap-4">
              {isLoadingReviews ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !reviews.length ? (
                <Card className="bg-card">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No reviews found.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review: Seat) => (
                  <Card key={review.id} className="bg-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-foreground">{review.establishment.name}</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {user.role === 'admin' && `By ${review.user.username} • `}
                            Posted on {format(new Date(review.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {user.role === 'admin' && (
                            <div className="flex items-center gap-2 mr-4">
                              <Switch
                                checked={review.isVisible}
                                onCheckedChange={(checked) =>
                                  toggleVisibilityMutation.mutate({
                                    reviewId: review.id,
                                    isVisible: checked,
                                  })
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {review.isVisible ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                          )}
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
                            className="hover:bg-primary/10"
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-foreground">
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
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !editRequests.length ? (
                  <Card className="bg-card">
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        No pending edit requests.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  editRequests.map((request: EditRequest) => (
                    <Card key={request.id} className="bg-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-foreground">
                              {request.requestType === 'edit' ? 'Edit' : 'Delete'} Request
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
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
                                className="hover:bg-primary/10"
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
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                          <div className="space-y-2 text-foreground">
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

                <DialogFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (selectedReview) {
                        handleDelete(('seat' in selectedReview) ? selectedReview.seat.id : selectedReview.id);
                        setIsEditDialogOpen(false);
                      }
                    }}
                  >
                    Delete Review
                  </Button>
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