import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface YelpImageCarouselProps {
  photos: string[];
  className?: string;
  aspectRatio?: number;
}

export function YelpImageCarousel({ 
  photos, 
  className,
  aspectRatio = 16/9 
}: YelpImageCarouselProps) {
  if (!photos?.length) return null;

  return (
    <Carousel
      opts={{
        align: "start",
        loop: photos.length > 1,
      }}
      className={cn("w-full", className)}
    >
      <CarouselContent>
        {photos.map((photo, index) => (
          <CarouselItem key={index}>
            <AspectRatio ratio={aspectRatio} className="overflow-hidden rounded-lg">
              <img
                src={photo}
                alt={`Restaurant photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </AspectRatio>
          </CarouselItem>
        ))}
      </CarouselContent>
      {photos.length > 1 && (
        <>
          <CarouselPrevious className="left-2 top-1/2" />
          <CarouselNext className="right-2 top-1/2" />
        </>
      )}
    </Carousel>
  );
}
