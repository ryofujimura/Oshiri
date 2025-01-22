import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';

interface AuthFormData {
  username: string;
  password: string;
}

export function AuthButton() {
  const { user, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const { register: registerField, handleSubmit, reset } = useForm<AuthFormData>();
  const [isOpen, setIsOpen] = useState(false);

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isRegister) {
        await register(data);
      } else {
        await login(data);
      }
      setIsOpen(false);
      reset();
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  if (user) {
    return (
      <Button variant="outline" onClick={() => logout()}>
        Sign Out
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isRegister ? 'Register' : 'Sign In'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...registerField('username', { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...registerField('password', { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit">
              {isRegister ? 'Register' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}