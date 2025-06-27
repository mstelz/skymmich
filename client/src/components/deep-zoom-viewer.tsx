import { useEffect, useRef, useState, useCallback } from "react";
import OpenSeadragon from "openseadragon";

interface Annotation {
  pixelx: number;
  pixely: number;
  names?: string[];
  type?: string;
  radius?: number;
}

interface DeepZoomViewerProps {
  imageUrl: string;
  annotations?: Annotation[];
  onZoom?: (zoom: number) => void;
  fullHeight?: boolean;
}

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .osd-debug-overlay, .openseadragon-overlay {
      z-index: 999999 !important;
      pointer-events: auto !important;
      opacity: 1 !important;
      display: block !important;
      background-clip: padding-box !important;
    }
  `;
  document.head.appendChild(style);
}

export function DeepZoomViewer({ imageUrl, annotations = [], onZoom, fullHeight = false }: DeepZoomViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdViewer = useRef<OpenSeadragon.Viewer | null>(null);
  const overlayElements = useRef<HTMLDivElement[]>([]);
  const [viewerReady, setViewerReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  
  // Store the home position and zoom for full height mode
  const homePositionRef = useRef<{ center: any; zoom: number } | null>(null);
  
  // Variables for home position calculation
  let homeZoomLevel = 1;
  let homeCenter: any = null;
  let storedHomeZoom = 1;

  // Set up OpenSeadragon viewer
  useEffect(() => {
    setViewerReady(false);
    if (!viewerRef.current) return;
    if (osdViewer.current) {
      osdViewer.current.destroy();
      osdViewer.current = null;
    }
    osdViewer.current = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: "//openseadragon.github.io/openseadragon/images/",
      tileSources: {
        type: "image",
        url: imageUrl,
      },
      showNavigator: false,
      showFullPageControl: false,
      showHomeControl: false,
      showZoomControl: false,
      showRotationControl: false,
      minZoomLevel: fullHeight ? 0.1 : 0.5,
      defaultZoomLevel: fullHeight ? 0.5 : 1,
      maxZoomLevel: 20,
      visibilityRatio: 1.0,
      constrainDuringPan: true,
      preserveImageSizeOnResize: true,
      blendTime: 0.1,
      navigatorPosition: "TOP_RIGHT",
      navigatorHeight: "100px",
      navigatorWidth: "100px",
    });
    
    // Add zoom handler
    osdViewer.current.addHandler("zoom", (event: OpenSeadragon.ZoomEvent) => {
      if (onZoom) {
        onZoom(event.zoom);
      }
      setCurrentZoom(event.zoom);
    });
    
    osdViewer.current.addHandler("open", () => {
      setViewerReady(true);
      // Log image content size
      const tiledImage = osdViewer.current!.world.getItemAt(0);
      if (tiledImage) {
        const size = tiledImage.getContentSize();
        console.log('OpenSeadragon image content size:', size);
        
        // If in full height mode, fit the image to the viewport
        if (fullHeight) {
          setTimeout(() => {
            if (osdViewer.current) {
              const tiledImage = osdViewer.current.world.getItemAt(0);
              if (tiledImage) {
                const bounds = tiledImage.getBounds();
                osdViewer.current.viewport.fitBounds(bounds, true);
                
                // Calculate the home zoom level for full frame view
                const imageSize = tiledImage.getContentSize();
                const viewportSize = osdViewer.current.viewport.getContainerSize();
                const homeZoomX = viewportSize.x / imageSize.x;
                const homeZoomY = viewportSize.y / imageSize.y;
                const homeZoom = Math.min(homeZoomX, homeZoomY);
                
                // Update the home zoom level
                homeZoomLevel = homeZoom;
                
                // Store the home position and zoom
                homeCenter = osdViewer.current.viewport.getCenter();
                storedHomeZoom = osdViewer.current.viewport.getZoom();
                
                // Store in ref for the custom button
                homePositionRef.current = {
                  center: homeCenter,
                  zoom: storedHomeZoom
                };
                
                // Try to establish this as the home position by calling goHome
                // This should set the current view as the home position
                setTimeout(() => {
                  if (osdViewer.current) {
                    osdViewer.current.viewport.goHome();
                  }
                }, 100);
              }
            }
          }, 300);
        } else {
          // For non-expanded mode, also fit the image to the frame
          setTimeout(() => {
            if (osdViewer.current) {
              const tiledImage = osdViewer.current.world.getItemAt(0);
              if (tiledImage) {
                const bounds = tiledImage.getBounds();
                osdViewer.current.viewport.fitBounds(bounds, true);
                
                // Store the home position using the actual zoom after fitBounds
                homePositionRef.current = {
                  center: osdViewer.current.viewport.getCenter(),
                  zoom: osdViewer.current.viewport.getZoom()
                };
              }
            }
          }, 300);
        }
      }
      setTimeout(() => {
        addOverlays();
      }, 500);
    });
    return () => {
      if (osdViewer.current) {
        osdViewer.current.destroy();
        osdViewer.current = null;
      }
    };
  }, [imageUrl, onZoom, fullHeight]);

  // Function to add overlays
  const addOverlays = useCallback(() => {
    if (!osdViewer.current) return;
    
    // Remove old overlays
    overlayElements.current.forEach(el => {
      try { osdViewer.current!.removeOverlay(el); } catch {}
    });
    overlayElements.current = [];
    
    // Add annotation overlays
    annotations.forEach((annotation, idx) => {
      if (annotation.pixelx == null || annotation.pixely == null) return;
      if (annotation.radius && annotation.radius > 0) {
        // Render circle overlay
        const rect = osdViewer.current.viewport.imageToViewportRectangle(
          annotation.pixelx - annotation.radius,
          annotation.pixely - annotation.radius,
          annotation.radius * 2,
          annotation.radius * 2
        );
        const circleDiv = document.createElement('div');
        circleDiv.style.width = '100%';
        circleDiv.style.height = '100%';
        circleDiv.style.border = '2px solid #00FF00';
        circleDiv.style.borderRadius = '50%';
        circleDiv.style.boxSizing = 'border-box';
        circleDiv.style.pointerEvents = 'none';
        circleDiv.style.background = 'transparent';
        circleDiv.style.position = 'absolute';
        if (annotation.names && annotation.names[0]) {
          const labelDiv = document.createElement('div');
          labelDiv.style.position = 'absolute';
          labelDiv.style.left = '50%';
          labelDiv.style.top = '0';
          labelDiv.style.transform = 'translate(-50%, -120%)';
          labelDiv.style.color = '#00FF00';
          labelDiv.style.fontSize = '14px';
          labelDiv.style.fontFamily = 'Arial, sans-serif';
          labelDiv.style.fontWeight = 'bold';
          labelDiv.style.textShadow = '0 0 2px #000';
          labelDiv.style.whiteSpace = 'nowrap';
          labelDiv.textContent = annotation.names[0];
          circleDiv.appendChild(labelDiv);
        }
        overlayElements.current.push(circleDiv);
        osdViewer.current.addOverlay({
          element: circleDiv,
          location: rect,
        });
      } else {
        // Render dot overlay (8px diameter)
        const dotSize = 8;
        const rect = osdViewer.current.viewport.imageToViewportRectangle(
          annotation.pixelx - dotSize / 2,
          annotation.pixely - dotSize / 2,
          dotSize,
          dotSize
        );
        const dotDiv = document.createElement('div');
        dotDiv.style.width = '100%';
        dotDiv.style.height = '100%';
        dotDiv.style.background = '#00FF00';
        dotDiv.style.borderRadius = '50%';
        dotDiv.style.boxSizing = 'border-box';
        dotDiv.style.pointerEvents = 'none';
        dotDiv.style.position = 'absolute';
        if (annotation.names && annotation.names[0]) {
          const labelDiv = document.createElement('div');
          labelDiv.style.position = 'absolute';
          labelDiv.style.left = '50%';
          labelDiv.style.top = '0';
          labelDiv.style.transform = 'translate(-50%, -120%)';
          labelDiv.style.color = '#00FF00';
          labelDiv.style.fontSize = '14px';
          labelDiv.style.fontFamily = 'Arial, sans-serif';
          labelDiv.style.fontWeight = 'bold';
          labelDiv.style.textShadow = '0 0 2px #000';
          labelDiv.style.whiteSpace = 'nowrap';
          labelDiv.textContent = annotation.names[0];
          dotDiv.appendChild(labelDiv);
        }
        overlayElements.current.push(dotDiv);
        osdViewer.current.addOverlay({
          element: dotDiv,
          location: rect,
        });
      }
    });
    osdViewer.current.forceRedraw();
  }, [annotations]);

  // Add/remove overlays when annotations change
  useEffect(() => {
    if (!osdViewer.current || !viewerReady) return;
    addOverlays();
    return () => {
      if (osdViewer.current) {
        overlayElements.current.forEach(el => {
          try { osdViewer.current!.removeOverlay(el); } catch {}
        });
        overlayElements.current = [];
      }
    };
  }, [annotations, viewerReady, addOverlays]);

  // Handle fullHeight changes
  useEffect(() => {
    if (!osdViewer.current || !viewerReady) return;
    
    if (fullHeight) {
      setTimeout(() => {
        if (osdViewer.current) {
          const tiledImage = osdViewer.current.world.getItemAt(0);
          if (tiledImage) {
            const bounds = tiledImage.getBounds();
            osdViewer.current.viewport.fitBounds(bounds, true);
            
            // Recalculate the home zoom level for full frame view
            const imageSize = tiledImage.getContentSize();
            const viewportSize = osdViewer.current.viewport.getContainerSize();
            const homeZoomX = viewportSize.x / imageSize.x;
            const homeZoomY = viewportSize.y / imageSize.y;
            const homeZoom = Math.min(homeZoomX, homeZoomY);
            
            // Update the home zoom level
            homeZoomLevel = homeZoom;
            
            // Store the home position and zoom
            homeCenter = osdViewer.current.viewport.getCenter();
            storedHomeZoom = osdViewer.current.viewport.getZoom();
            
            // Store in ref for the custom button
            homePositionRef.current = {
              center: homeCenter,
              zoom: storedHomeZoom
            };
          }
        }
      }, 300);
    } else {
      // For non-expanded mode, also fit the image to the frame
      setTimeout(() => {
        if (osdViewer.current) {
          const tiledImage = osdViewer.current.world.getItemAt(0);
          if (tiledImage) {
            const bounds = tiledImage.getBounds();
            osdViewer.current.viewport.fitBounds(bounds, true);
            
            // Store the home position using the actual zoom after fitBounds
            homePositionRef.current = {
              center: osdViewer.current.viewport.getCenter(),
              zoom: osdViewer.current.viewport.getZoom()
            };
          }
        }
      }, 300);
    }
  }, [fullHeight, viewerReady]);

  return (
    <div style={{ position: "relative", width: "100%", height: fullHeight ? "100vh" : "90vh" }}>
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
      
      {/* Zoom percentage display */}
      <div
        onClick={() => {
          if (osdViewer.current && homePositionRef.current) {
            // Use stored home position for both modes
            osdViewer.current.viewport.panTo(homePositionRef.current.center);
            osdViewer.current.viewport.zoomTo(homePositionRef.current.zoom);
          }
        }}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "8px 12px",
          fontSize: "12px",
          fontFamily: "monospace",
          cursor: "pointer",
        }}
      >
        {Math.round(currentZoom * 100)}%
      </div>
    </div>
  );
} 