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

export function DeepZoomViewer({ imageUrl, annotations = [], onZoom }: DeepZoomViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdViewer = useRef<OpenSeadragon.Viewer | null>(null);
  const overlayElements = useRef<HTMLDivElement[]>([]);
  const [viewerReady, setViewerReady] = useState(false);

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
      showNavigator: true,
      showFullPageControl: false,
      showHomeControl: true,
      showZoomControl: true,
      showRotationControl: false,
      minZoomLevel: 1,
      defaultZoomLevel: 1,
      maxZoomLevel: 20,
      visibilityRatio: 1.0,
      constrainDuringPan: true,
      preserveImageSizeOnResize: true,
      blendTime: 0.1,
    });
    
    // Add zoom handler
    osdViewer.current.addHandler("zoom", (event: OpenSeadragon.ZoomEvent) => {
      if (onZoom) {
        onZoom(event.zoom);
      }
    });
    
    osdViewer.current.addHandler("open", () => {
      setViewerReady(true);
      // Log image content size
      const tiledImage = osdViewer.current!.world.getItemAt(0);
      if (tiledImage) {
        const size = tiledImage.getContentSize();
        console.log('OpenSeadragon image content size:', size);
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
  }, [imageUrl, onZoom]);

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

  return (
    <div style={{ position: "relative", width: "100%", height: "70vh" }}>
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
} 