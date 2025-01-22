import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, SelectUser } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

interface AuthResponse {
  message: string;
  user: SelectUser;
}

async function handleAuthRequest(
  url: string,
  method: string,
  body?: { username: string; password: string }
): Promise<AuthResponse> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message);
  }

  return response.json();
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<SelectUser>({
    queryKey: ['/api/user'],
    retry: false,
  });

  const login = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      handleAuthRequest('/api/login', 'POST', credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Success",
        description: "Logged in successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const register = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      handleAuthRequest('/api/register', 'POST', credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Success",
        description: "Registered successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const logout = useMutation({
    mutationFn: () => handleAuthRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return {
    user,
    isLoading,
    login: login.mutate,
    register: register.mutate,
    logout: logout.mutate,
  };
}
