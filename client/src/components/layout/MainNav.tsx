import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, Search, MapPin, Star, User, MessageSquarePlus, X, Database } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const routes = [
  {
    title: 'Search',
    href: '/search',
    icon: Search,
    description: 'Find your perfect seating spot',
  },
  {
    title: 'Near Me',
    href: '/near-me',
    icon: MapPin,
    description: 'Discover local restaurants',
  },
  {
    title: 'Top Rated',
    href: '/top-rated',
    icon: Star,
    description: 'Best rated seating experiences',
  },
  {
    title: 'Feedback',
    href: '/feedback',
    icon: MessageSquarePlus,
    description: 'Share your thoughts and suggestions',
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    description: 'View your reviews and settings',
  },
  {
    title: 'Proto',
    href: '/admin/proto',
    icon: Database,
    description: 'Database Analytics Dashboard',
    adminOnly: true,
  },
];

export function MainNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const visibleRoutes = routes.filter(route => !route.adminOnly || (user?.role === 'admin'));

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        {visibleRoutes.map((route) => (
          <Link key={route.href} href={route.href}>
            <a
              className={cn(
                'group flex items-center text-sm font-medium transition-colors hover:text-primary relative px-2 py-1.5',
                location === route.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <route.icon className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              {route.title}
              {location === route.href && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary scale-x-100 transition-transform" />
              )}
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-12 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none whitespace-nowrap">
                {route.description}
              </span>
            </a>
          </Link>
        ))}
      </nav>

      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="relative">
            <Menu className={cn(
              "h-5 w-5 transition-transform duration-200",
              open && "scale-0"
            )} />
            <X className={cn(
              "h-5 w-5 absolute transition-transform duration-200",
              open ? "scale-100" : "scale-0"
            )} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
          <ScrollArea className="h-full py-6 relative bg-background">
            <div className="space-y-1 px-2">
              {visibleRoutes.map((route) => (
                <Link key={route.href} href={route.href}>
                  <SheetClose asChild>
                    <a
                      className={cn(
                        'flex flex-col gap-1 px-4 py-3 text-sm transition-colors rounded-md hover:bg-primary/5',
                        location === route.href
                          ? 'bg-primary/5 text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className="h-5 w-5" />
                        <span className="font-medium">{route.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-8">
                        {route.description}
                      </span>
                    </a>
                  </SheetClose>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}