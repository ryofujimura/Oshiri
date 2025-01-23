import { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SeatImage {
  id: number;
  imageUrl: string;
  width?: number;
  height?: number;
}

interface Props {
  images: SeatImage[];
}

export function SeatImageCarousel({ images }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollPrev = () => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setCurrentIndex(emblaApi.selectedScrollSnap());
    }
  };

  const scrollNext = () => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setCurrentIndex(emblaApi.selectedScrollSnap());
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative flex-[0_0_100%] min-w-0"
            >
              <img
                src={image.imageUrl}
                alt={`Seat view ${index + 1}`}
                className="w-full h-64 object-cover rounded-md"
              />
            </div>
          ))}
        </div>
      </div>
      
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary'
                    : 'bg-primary/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
