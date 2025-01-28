import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainNav } from '@/components/layout/MainNav';
import { AuthButton } from '@/components/auth/AuthButton';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';
import * as d3 from 'd3';

// Type definitions for our database schema
interface DatabaseStats {
  users: number;
  establishments: number;
  seats: number;
  reviews: number;
  images: number;
}

export default function ProtoPage() {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch database statistics
  const { data: stats, isLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/database/stats'],
    enabled: !!user && user.role === 'admin',
  });

  useEffect(() => {
    if (!stats || !svgRef.current) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create scales
    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top]);

    // Prepare data
    const data = Object.entries(stats).map(([key, value]) => ({
      category: key,
      value: value
    }));

    // Update domains
    x.domain(data.map(d => d.category));
    y.domain([0, d3.max(data, d => d.value) || 0]);

    // Add bars
    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.category)!)
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.value))
      .attr('fill', 'var(--primary)')
      .attr('rx', 4);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  }, [stats]);

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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Database Analytics</CardTitle>
            <CardDescription>
              Visual representation of database statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="flex justify-center overflow-x-auto">
                <svg ref={svgRef}></svg>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
