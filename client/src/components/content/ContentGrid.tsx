import { useState, useEffect } from 'react';
import { ContentCard } from './ContentCard';
import { ContentDialog } from './ContentDialog';
import { useQuery } from '@tanstack/react-query';
import { AdSense } from '../ads/AdSense';

export function ContentGrid() {
  const [editingContent, setEditingContent] = useState(null);
  const [columns, setColumns] = useState(3); // Default to desktop view

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ['/api/contents'],
  });

  // Update columns based on screen size
  useEffect(() => {
    function updateColumns() {
      if (window.innerWidth < 768) { // md breakpoint
        setColumns(1);
      } else if (window.innerWidth < 1024) { // lg breakpoint
        setColumns(2);
      } else {
        setColumns(3);
      }
    }

    // Set initial value
    updateColumns();

    // Add resize listener
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Create array with content items and ads
  const itemsWithAds = contents.reduce((acc: React.ReactNode[], content, index) => {
    // Add the content
    acc.push(
      <ContentCard 
        key={content.id} 
        content={content} 
        onEdit={(content) => setEditingContent(content)}
      />
    );

    // Calculate if we're at the end of 4 rows based on current column count
    const itemsPerRow = columns;
    const itemsPerFourRows = itemsPerRow * 4;
    const isEndOfFourRows = (index + 1) % itemsPerFourRows === 0;
    const isLastItem = index === contents.length - 1;

    // Add an ad after every 4 rows (but not after the last row)
    if (isEndOfFourRows && !isLastItem) {
      acc.push(
        <div key={`ad-${index}`} className="col-span-full">
          <AdSense
            slot="1234567890" // Replace with your actual ad slot ID
            format="auto"
            className="w-full min-h-[90px] bg-gray-50"
          />
        </div>
      );
    }

    return acc;
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemsWithAds}
      </div>

      <ContentDialog 
        content={editingContent}
        open={!!editingContent}
        onOpenChange={(open) => !open && setEditingContent(null)}
      />
    </>
  );
}