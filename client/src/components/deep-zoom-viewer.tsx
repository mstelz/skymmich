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

export function DeepZoomViewer({ imageUrl, annotations = [], onZoom }: DeepZoomViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdViewer = useRef<OpenSeadragon.Viewer | null>(null);
  const overlayElements = useRef<HTMLDivElement[]>([]);
  const [viewerReady, setViewerReady] = useState(false);

  // Helper to create overlay HTML element
  const createOverlayElement = (annotation: Annotation, index: number) => {
    const el = document.createElement('div');
    el.className = 'annotation-overlay';
    el.style.cssText = `
      background: rgba(255, 0, 0, 0.7);
      border: 2px solid red;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      position: absolute;
      pointer-events: none;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
    `;
    el.textContent = (index + 1).toString();
    el.title = `${annotation.names && annotation.names[0] ? annotation.names[0] : annotation.type || "?"}
    ${annotation.pixelx !== null ? `, ${annotation.pixelx}` : ''}
    ${annotation.pixely !== null ? `, ${annotation.pixely}` : ''}`;
    console.log('Created overlay element:', el, 'with style:', el.style.cssText);
    return el;
  };

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
    if (onZoom) {
      osdViewer.current.addHandler("zoom", (event: OpenSeadragon.ZoomEvent) => {
        onZoom(event.zoom);
      });
    }
    osdViewer.current.addHandler("open", () => {
      console.log('OSD image opened');
      setViewerReady(true);
      const tiledImage = osdViewer.current!.world.getItemAt(0);
      if (tiledImage) {
        const size = tiledImage.getContentSize();
        console.log('OSD image dimensions:', size);
        
        // Wait a bit for the image to be fully rendered
        setTimeout(() => {
          console.log('Adding overlays after image load');
          addOverlays();
        }, 500);
      }
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
    
    // Debug: check viewport state
    const viewport = osdViewer.current.viewport;
    console.log('Viewport state:', {
      zoom: viewport.getZoom(),
      center: viewport.getCenter(),
      bounds: viewport.getBounds(),
      homeBounds: viewport.getHomeBounds()
    });
    
    // Get displayed image width and original image width
    const tiledImage = osdViewer.current.world.getItemAt(0);
    let displayScale = 1;
    let displayedImageWidth = 1;
    if (tiledImage && viewerRef.current) {
      const originalImageWidth = tiledImage.getContentSize().x;
      displayedImageWidth = viewerRef.current.getBoundingClientRect().width;
      displayScale = displayedImageWidth / originalImageWidth;
    }

    annotations.forEach((annotation, idx) => {
      if (annotation.pixelx == null || annotation.pixely == null) return;
      // Convert image coordinates to viewport coordinates
      const viewportPoint = osdViewer.current!.viewport.imageToViewportCoordinates(
        annotation.pixelx,
        annotation.pixely
      );
      let circleDiv: HTMLDivElement | null = null;
      if (annotation.radius != null) {
        // Use pixel units for the circle size
        const circlePx = annotation.radius * 2 * displayScale;
        circleDiv = document.createElement('div');
        circleDiv.style.position = 'absolute';
        circleDiv.style.width = `${circlePx}px`;
        circleDiv.style.height = `${circlePx}px`;
        circleDiv.style.left = '50%';
        circleDiv.style.top = '50%';
        circleDiv.style.transform = 'translate(-50%, -50%)';
        circleDiv.style.border = '2px solid #00FF00';
        circleDiv.style.borderRadius = '50%';
        circleDiv.style.boxSizing = 'border-box';
        circleDiv.style.pointerEvents = 'none';
        circleDiv.style.zIndex = '3000';
        circleDiv.style.background = 'transparent';
      }
      // Create label div (above the circle)
      const labelDiv = document.createElement('div');
      labelDiv.style.position = 'absolute';
      labelDiv.style.left = '50%';
      labelDiv.style.top = '0';
      labelDiv.style.transform = 'translate(-50%, -120%)';
      labelDiv.style.color = '#00FF00';
      labelDiv.style.fontSize = '20px';
      labelDiv.style.fontFamily = 'Arial, sans-serif';
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.textShadow = '0 0 2px #000';
      labelDiv.style.background = 'rgba(0,0,0,0.3)'; // for debugging
      labelDiv.textContent = annotation.names && annotation.names[0] ? annotation.names[0] : annotation.type || '?';
      // Wrap both in a container
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.pointerEvents = 'none';
      wrapper.style.zIndex = '3000';
      if (circleDiv) wrapper.appendChild(circleDiv);
      wrapper.appendChild(labelDiv);
      overlayElements.current.push(wrapper);
      osdViewer.current!.addOverlay({
        element: wrapper,
        location: viewportPoint,
        placement: OpenSeadragon.Placement.CENTER,
      });
    });
  }, [annotations]);

  // Add/remove overlays when annotations change
  useEffect(() => {
    if (!osdViewer.current || !viewerReady) return;
    addOverlays();
    // Cleanup overlays on unmount/change
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