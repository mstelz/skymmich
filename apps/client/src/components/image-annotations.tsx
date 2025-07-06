import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Annotation {
  ra: number | null;
  dec: number | null;
  pixelx?: number;
  pixely?: number;
  pixelX?: number;
  pixelY?: number;
  names?: string[];
  type?: string;
  magnitude?: number;
  radius?: number;
  [key: string]: any;
}

interface Calibration {
  ra: number;
  dec: number;
  pixscale: number;
  radius: number;
  orientation: number;
}

interface ImageDimensions {
  width: number | null;
  height: number | null;
}

interface AnnotationsData {
  annotations: Annotation[];
  calibration: Calibration;
  imageDimensions: ImageDimensions;
}

interface ImageAnnotationsProps {
  imageId: number;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function ImageAnnotations({ 
  imageId, 
  displayWidth,
  displayHeight,
  naturalWidth,
  naturalHeight,
  isVisible, 
  onToggleVisibility 
}: ImageAnnotationsProps) {
  const [showLabels, setShowLabels] = useState(true);

  const { data: annotationsData, isLoading, error } = useQuery({
    queryKey: ["/api/images", imageId, "annotations"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/images/${imageId}/annotations`);
      return response.json() as Promise<AnnotationsData>;
    },
    enabled: isVisible && imageId > 0,
  });

  // Convert RA/Dec to pixel coordinates
  const convertCoordinates = (ra: number, dec: number, calibration: Calibration) => {
    // This is a simplified conversion - in practice, you'd use proper WCS transformations
    // For now, we'll use a basic linear approximation
    
    const centerRa = calibration.ra;
    const centerDec = calibration.dec;
    const radius = calibration.radius; // in degrees
    
    // Calculate relative position from center
    const deltaRa = (ra - centerRa) * Math.cos(centerDec * Math.PI / 180);
    const deltaDec = dec - centerDec;
    
    // Convert to pixel coordinates (assuming image is centered)
    const pixelX = (displayWidth / 2) + (deltaRa / radius) * (displayWidth / 2);
    const pixelY = (displayHeight / 2) - (deltaDec / radius) * (displayHeight / 2);
    
    return { x: pixelX, y: pixelY };
  };

  if (!isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="flex items-center space-x-2 text-white">
          <Loader className="h-4 w-4 animate-spin" />
          <span>Loading annotations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="text-center text-white">
          <p className="text-sm">Failed to load annotations</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!annotationsData?.annotations || annotationsData.annotations.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="text-center text-white">
          <p className="text-sm">No annotations found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Annotation Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="bg-black/50 text-white border-white/20 hover:bg-black/70"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        
        {isVisible && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className="bg-black/50 text-white border-white/20 hover:bg-black/70"
          >
            {showLabels ? "Hide Labels" : "Show Labels"}
          </Button>
        )}
      </div>

      {/* Annotations Count Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-black/50 text-white border-white/20">
          {annotationsData.annotations.length} objects
        </Badge>
      </div>

      {/* SVG Overlay */}
      <svg
        width={displayWidth}
        height={displayHeight}
        viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 5 }}
      >
        {annotationsData.annotations.map((annotation: Annotation, index: number) => {
          // Use pixel coordinates directly if available, otherwise convert from RA/Dec
          let coords;
          if (annotation.pixelx !== undefined && annotation.pixely !== undefined) {
            coords = { x: annotation.pixelx, y: annotation.pixely };
          } else if (annotation.ra && annotation.dec) {
            coords = convertCoordinates(annotation.ra, annotation.dec, annotationsData.calibration);
          } else {
            // Skip annotations without coordinates
            return null;
          }
          
          return (
            <g key={index} className="pointer-events-auto">
              {/* Crosshair */}
              <line
                x1={coords.x - 10}
                y1={coords.y}
                x2={coords.x + 10}
                y2={coords.y}
                stroke="red"
                strokeWidth="2"
                opacity="0.8"
              />
              <line
                x1={coords.x}
                y1={coords.y - 10}
                x2={coords.x}
                y2={coords.y + 10}
                stroke="red"
                strokeWidth="2"
                opacity="0.8"
              />
              
              {/* Circle */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r="8"
                fill="none"
                stroke="red"
                strokeWidth="2"
                opacity="0.6"
              />
              
              {/* Label */}
              {showLabels && annotation.names && annotation.names[0] && (
                <text
                  x={coords.x + 15}
                  y={coords.y - 5}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-auto"
                  style={{
                    textShadow: "1px 1px 2px black",
                    filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.8))"
                  }}
                >
                  {annotation.names[0]}
                </text>
              )}
              
              {/* Type */}
              {showLabels && annotation.type && (
                <text
                  x={coords.x + 15}
                  y={coords.y + 10}
                  fill="yellow"
                  fontSize="10"
                  className="pointer-events-auto"
                  style={{
                    textShadow: "1px 1px 2px black",
                    filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.8))"
                  }}
                >
                  {annotation.type}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
} 