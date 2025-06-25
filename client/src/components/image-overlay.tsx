import { useState } from "react";
import { X, Eye, Loader, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeepZoomViewer } from "./deep-zoom-viewer";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AstroImage } from "@shared/schema";

interface ImageOverlayProps {
  image: AstroImage;
  onClose: () => void;
}

export function ImageOverlay({ image, onClose }: ImageOverlayProps) {
  const [showAnnotations, setShowAnnotations] = useState(false);

  // Fetch annotations only if plate solved and showAnnotations is true
  const { data: annotationsData, isLoading: annotationsLoading } = useQuery({
    queryKey: ["/api/images", image.id, "annotations"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/images/${image.id}/annotations`);
      return response.json();
    },
    enabled: !!(showAnnotations && image.plateSolved),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Info panel */}
      <aside
        className="w-full max-w-md h-full flex flex-col gap-6 shadow-2xl border-r border-black/60 relative"
        style={{ background: "hsl(217, 86%, 17%)" }} // astro-blue
      >
        {/* Close button */}
        <button
          className="absolute top-6 left-6 z-60 bg-black/70 rounded-full p-2 hover:bg-black/90"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-6 w-6 text-white" />
        </button>
        <div className="pt-20 px-8 pb-8 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-white">{image.title}</h2>
            <p className="text-sm text-gray-300 mb-2">
              Captured on {image.captureDate ? new Date(image.captureDate).toLocaleDateString() : "Unknown date"}
            </p>
          </div>
          {/* Technical Details */}
          <section className="bg-black/30 rounded-xl p-4 mb-2 shadow border border-black/40">
            <h3 className="font-semibold mb-2 text-white">Technical Details</h3>
            <div className="text-xs text-gray-300 space-y-1 font-mono">
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
          </section>
          {/* Plate Solution */}
          <section className="bg-black/30 rounded-xl p-4 mb-2 shadow border border-black/40">
            <h3 className="font-semibold mb-2 text-white">Plate Solution</h3>
            {image.plateSolved ? (
              <div className="text-xs text-gray-300 space-y-1">
                {image.ra && <div>RA: {image.ra}</div>}
                {image.dec && <div>Dec: {image.dec}</div>}
                {image.pixelScale && <div>Pixel Scale: {image.pixelScale}"/pixel</div>}
                {image.fieldOfView && <div>Field of View: {image.fieldOfView}</div>}
                {image.rotation && <div>Rotation: {image.rotation}°</div>}
                <div className="text-green-400 flex items-center mt-1">
                  <Badge className="status-plate-solved">✓ Verified by Astrometry.net</Badge>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                <p>No plate solving data available.</p>
              </div>
            )}
          </section>
          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <section className="bg-black/30 rounded-xl p-4 mb-2 shadow border border-black/40">
              <h3 className="font-semibold mb-2 text-white">Tags</h3>
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
            </section>
          )}
          {/* Description */}
          {image.description && (
            <section className="bg-black/30 rounded-xl p-4 mb-2 shadow border border-black/40">
              <h3 className="font-semibold mb-2 text-white">Description</h3>
              <p className="text-gray-300 text-sm">{image.description}</p>
            </section>
          )}
        </div>
      </aside>

      {/* Image panel */}
      <main className="flex-1 flex items-center justify-center bg-black">
        {image.immichId ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <DeepZoomViewer
              imageUrl={`/api/assets/${image.immichId}/original`}
              annotations={showAnnotations && annotationsData?.annotations ? annotationsData.annotations : []}
            />
            {/* Annotation Toggle Button */}
            {image.plateSolved && (
              <div className="absolute bottom-4 right-4 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                  disabled={annotationsLoading}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showAnnotations ? "Hide" : "Show"} Annotations
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Image not available</span>
          </div>
        )}
      </main>
    </div>
  );
} 