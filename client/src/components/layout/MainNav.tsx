import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, Search, MapPin, Star, User, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const routes = [
  {
    title: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    title: 'Near Me',
    href: '/near-me',
    icon: MapPin,
  },
  {
    title: 'Top Rated',
    href: '/top-rated',
    icon: Star,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
];

export function MainNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-4">
        {routes.map((route) => (
          <Link key={route.href} href={route.href}>
            <a
              className={cn(
                'flex items-center text-sm font-medium transition-colors hover:text-primary',
                location === route.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <route.icon className="h-4 w-4 mr-2" />
              {route.title}
            </a>
          </Link>
        ))}
      </nav>

      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <ScrollArea className="h-full py-6">
            <div className="space-y-4">
              {routes.map((route) => (
                <Link key={route.href} href={route.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-primary/5',
                      location === route.href
                        ? 'text-primary bg-primary/5'
                        : 'text-muted-foreground'
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.title}
                  </a>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}