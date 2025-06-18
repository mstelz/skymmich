import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Crosshair, Loader } from "lucide-react";
import type { AstroImage } from "@shared/schema";

interface ImageModalProps {
  image: AstroImage;
  onClose: () => void;
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const queryClient = useQueryClient();

  const plateSolveMutation = useMutation({
    mutationFn: (imageId: number) => apiRequest("POST", `/api/images/${imageId}/plate-solve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handlePlateSolve = () => {
    plateSolveMutation.mutate(image.id);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {image.title}
              </DialogTitle>
              <p className="text-muted-foreground">
                Captured on {image.captureDate 
                  ? new Date(image.captureDate).toLocaleDateString()
                  : "Unknown date"
                }
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-card rounded-xl p-4">
          <div className="relative mb-4">
            {image.fullUrl ? (
              <img
                src={image.fullUrl}
                alt={image.title}
                className={`w-full h-auto rounded-lg cursor-zoom-in transition-transform ${
                  isZoomed ? "scale-150" : "scale-100"
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Image not available</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Technical Details</h4>
              <div className="text-sm text-muted-foreground space-y-1 font-mono">
                {image.telescope && <div>Telescope: {image.telescope}</div>}
                {image.camera && <div>Camera: {image.camera}</div>}
                {image.mount && <div>Mount: {image.mount}</div>}
                {image.focalLength && <div>Focal Length: {image.focalLength}mm</div>}
                {image.aperture && <div>Aperture: {image.aperture}</div>}
                {image.exposureTime && <div>Exposure: {image.exposureTime}</div>}
                {image.iso && <div>ISO/Gain: {image.iso}</div>}
                {image.frameCount && <div>Frame Count: {image.frameCount}</div>}
                {image.totalIntegration && <div>Total Integration: {image.totalIntegration}h</div>}
                {image.filters && <div>Filters: {image.filters}</div>}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">Plate Solution</h4>
                {!image.plateSolved && (
                  <Button
                    onClick={handlePlateSolve}
                    disabled={plateSolveMutation.isPending}
                    size="sm"
                    className="astro-button-secondary"
                  >
                    {plateSolveMutation.isPending ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="mr-2 h-4 w-4" />
                    )}
                    Solve
                  </Button>
                )}
              </div>
              
              {image.plateSolved ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  {image.ra && <div>RA: {image.ra}</div>}
                  {image.dec && <div>Dec: {image.dec}</div>}
                  {image.pixelScale && <div>Pixel Scale: {image.pixelScale}"/pixel</div>}
                  {image.fieldOfView && <div>Field of View: {image.fieldOfView}</div>}
                  {image.rotation && <div>Rotation: {image.rotation}°</div>}
                  <div className="text-green-400 flex items-center">
                    <Badge className="status-plate-solved">✓ Verified by Astrometry.net</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>No plate solving data available.</p>
                  <p className="mt-2">Click "Solve" to submit this image to Astrometry.net for plate solving.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-foreground mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <Badge key={tag} className="astro-tag">
                    {tag}
                  </Badge>
                ))}
                {image.objectType && (
                  <Badge className="astro-tag">{image.objectType}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {image.description && (
            <div className="mt-4">
              <h4 className="font-semibold text-foreground mb-2">Description</h4>
              <p className="text-muted-foreground text-sm">{image.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
