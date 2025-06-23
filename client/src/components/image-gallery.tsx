import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Share, Plus, Settings } from "lucide-react";
import type { AstroImage, Equipment } from "@shared/schema";
import { RemoteImage } from "./remote-image";

interface ImageGalleryProps {
  images: AstroImage[];
  equipment: Equipment[];
  onImageClick: (image: AstroImage) => void;
  isLoading: boolean;
}

export function ImageGallery({ images, equipment, onImageClick, isLoading }: ImageGalleryProps) {
  const getStatusBadge = (image: AstroImage) => {
    if (image.plateSolved) {
      return <Badge className="status-plate-solved">Plate Solved</Badge>;
    }
    return <Badge className="status-no-data">No Plate Data</Badge>;
  };

  const formatExposureData = (image: AstroImage) => {
    const parts = [];
    if (image.focalLength) parts.push(`${image.focalLength}mm`);
    if (image.aperture) parts.push(image.aperture);
    if (image.iso) parts.push(`ISO ${image.iso}`);
    if (image.exposureTime) parts.push(image.exposureTime);
    return parts.join(' • ');
  };

  const formatIntegrationData = (image: AstroImage) => {
    const parts = [];
    if (image.frameCount) parts.push(`${image.frameCount} frames`);
    if (image.totalIntegration) parts.push(`${image.totalIntegration}h total`);
    return parts.join(' • ');
  };

  // TODO: Replace with your actual API token retrieval logic
  const apiToken = localStorage.getItem("apiToken") || "";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="astro-card animate-pulse">
            <div className="w-full h-48 bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No astrophotography images found. Sync with Immich to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {images.map((image) => (
          <Card
            key={image.id}
            className="astro-card image-hover group"
            onClick={() => onImageClick(image)}
          >
            <div className="relative">
              {image.thumbnailUrl ? (
                <RemoteImage
                  src={image.thumbnailUrl}
                  alt={image.title}
                  className="w-full h-48 object-cover transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-2">{image.title}</h3>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>
                  {image.captureDate 
                    ? new Date(image.captureDate).toLocaleDateString()
                    : "Unknown date"
                  }
                </span>
                {getStatusBadge(image)}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1 font-mono mb-3">
                <div>{formatExposureData(image) || "No exposure data"}</div>
                <div>{formatIntegrationData(image) || "No integration data"}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {image.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} className="astro-tag">
                      {tag}
                    </Badge>
                  ))}
                  {image.objectType && (
                    <Badge className="astro-tag">{image.objectType}</Badge>
                  )}
                </div>
                
                <div className="flex space-x-2 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="hover:text-destructive">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:text-primary">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equipment Section */}
      {equipment.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <Settings className="mr-2 text-primary" />
            Equipment Gallery
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {equipment.map((item) => (
              <Card key={item.id} className="astro-card">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-32 object-cover"
                  />
                )}
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-foreground">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Load More */}
      <div className="text-center">
        <Button className="astro-button-primary">
          <Plus className="mr-2 h-4 w-4" />
          Load More Images
        </Button>
      </div>
    </>
  );
}
