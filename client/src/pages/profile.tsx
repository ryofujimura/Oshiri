import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PenSquare, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/users/reviews'],
    enabled: !!user,
  });

  const { data: editRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/users/edit-requests'],
    enabled: !!user && user.role === 'admin',
  });

  const handleEditRequest = async (reviewId: number, type: 'edit' | 'delete') => {
    try {
      const response = await fetch(`/api/seats/${reviewId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: 'Success',
        description: `${type === 'edit' ? 'Edit' : 'Delete'} request submitted successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/users/reviews'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAdminAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/edit-requests/${requestId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: 'Success',
        description: `Request ${action}d successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/users/edit-requests'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Welcome back, {user.username}!
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
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
            ) : reviews?.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    You haven't written any reviews yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviews?.map((review: any) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{review.establishment.name}</CardTitle>
                        <CardDescription>
                          Posted on {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditRequest(review.id, 'edit')}
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleEditRequest(review.id, 'delete')}
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
              ) : editRequests?.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No pending edit requests.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                editRequests?.map((request: any) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {request.requestType === 'edit' ? 'Edit' : 'Delete'} Request
                          </CardTitle>
                          <CardDescription>
                            By {request.user.username} on{' '}
                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            onClick={() => handleAdminAction(request.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleAdminAction(request.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Review ID:</strong> {request.seatId}</p>
                        {request.requestType === 'edit' && (
                          <>
                            <p><strong>New Type:</strong> {request.type}</p>
                            <p><strong>New Comfort Rating:</strong> {request.comfortRating}</p>
                            <p><strong>New Description:</strong> {request.description}</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
