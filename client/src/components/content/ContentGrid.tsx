import { useState } from 'react';
import { ContentCard } from './ContentCard';
import { ContentDialog } from './ContentDialog';
import { useQuery } from '@tanstack/react-query';

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contents.map((content) => (
          <ContentCard 
            key={content.id} 
            content={content} 
            onEdit={(content) => setEditingContent(content)}
          />
        ))}
      </div>

      <ContentDialog 
        content={editingContent}
        open={!!editingContent}
        onOpenChange={(open) => !open && setEditingContent(null)}
      />
    </>
  );
}