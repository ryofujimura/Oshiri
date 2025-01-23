import { useState } from 'react';
import { ContentCard } from './ContentCard';
import { ContentDialog } from './ContentDialog';
import { useQuery } from '@tanstack/react-query';
import { AdSense } from '../ads/AdSense';

export function ContentGrid() {
  const [editingContent, setEditingContent] = useState(null);
  const { data: contents = [], isLoading } = useQuery({
    queryKey: ['/api/contents'],
  });

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

    // Add an ad after every 4 rows (12 items) in the 3-column grid
    // Don't add after the last row
    if ((index + 1) % 12 === 0 && index !== contents.length - 1) {
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