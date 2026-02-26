import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";
import { Link } from "wouter";

declare global {
  interface Window {
    A: any;
  }
}

interface SkyMapMarker {
  id: number;
  title: string;
  ra: string;
  dec: string;
  thumbnailUrl: string | null;
  objectType: string | null;
  constellation: string | null;
  fieldOfView: string | null;
}

export default function SkyMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const aladinRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SkyMapMarker | null>(null);

  const { data: markers = [], isLoading } = useQuery<SkyMapMarker[]>({
    queryKey: ["/api/sky-map/markers"],
  });

  // Check WebGL2 availability
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      setWebglError(true);
    }
  }, []);

  // Load Aladin Lite script
  useEffect(() => {
    if (webglError) return;
    if (window.A) {
      if (window.A.init) {
        window.A.init.then(() => setScriptLoaded(true));
      } else {
        setScriptLoaded(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js";
    script.charset = "utf-8";
    script.onload = () => {
      if (window.A && window.A.init) {
        window.A.init.then(() => setScriptLoaded(true));
      } else {
        setScriptLoaded(true);
      }
    };
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleObjectClicked = useCallback((object: any) => {
    if (object && object.data) {
      setSelectedMarker(object.data as SkyMapMarker);
    } else {
      setSelectedMarker(null);
    }
  }, []);

  // Initialize Aladin and plot markers
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || isLoading || webglError) return;

    if (!aladinRef.current) {
      try {
        aladinRef.current = window.A.aladin(containerRef.current, {
          survey: "P/DSS2/color",
          fov: 180,
          projection: "AIT",
        });
        aladinRef.current.on("objectClicked", handleObjectClicked);
      } catch (err) {
        console.error("Aladin initialization failed:", err);
        setScriptError(true);
        return;
      }
    }

    const aladin = aladinRef.current;
    if (!aladin) return;

    // Clear existing catalogs
    const catalogs = aladin.view?.catalogs;
    if (catalogs) {
      while (catalogs.length > 0) {
        aladin.removeCatalog(catalogs[0]);
      }
    }

    if (markers.length === 0) return;

    const catalog = window.A.catalog({
      name: "My Images",
      sourceSize: 18,
      color: "#3b82f6",
      onClick: "showPopup",
    });
    aladin.addCatalog(catalog);

    const sources = markers
      .map((marker) => {
        const ra = parseFloat(marker.ra);
        const dec = parseFloat(marker.dec);
        if (isNaN(ra) || isNaN(dec)) return null;

        const source = window.A.marker(ra, dec, {
          popupTitle: marker.title,
          popupDesc: "",
        });
        source.data = marker;
        return source;
      })
      .filter(Boolean);

    catalog.addSources(sources);
  }, [scriptLoaded, markers, isLoading, handleObjectClicked]);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sky Map</h1>
            <p className="text-muted-foreground text-sm">
              {markers.length > 0
                ? `${markers.length} object${markers.length !== 1 ? "s" : ""} plotted`
                : "Visualize your plate-solved images on the sky"}
            </p>
          </div>
        </div>

        <div className="flex-1 relative mx-4 sm:mx-6 lg:mx-8 mb-4 rounded-lg overflow-hidden border border-border">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading markers...</p>
              </div>
            </div>
          ) : markers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <p className="text-muted-foreground font-medium">No plate-solved images to display</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Link href="/plate-solving" className="text-primary hover:underline">
                    Plate solve your images
                  </Link>
                  {" "}to see them on the sky map.
                </p>
              </div>
            </div>
          ) : webglError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10 text-center p-6">
              <div className="max-w-md mx-auto">
                <p className="text-destructive font-medium text-lg">WebGL2 Not Supported</p>
                <p className="text-sm text-muted-foreground mt-2">
                  The Sky Map requires WebGL2 to render the star atlas. Please try a modern browser like Chrome, Firefox, or Edge, and ensure hardware acceleration is enabled.
                </p>
              </div>
            </div>
          ) : scriptError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center">
                <p className="text-destructive font-medium">Failed to load sky atlas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Could not load Aladin Lite from CDN. Check your internet connection.
                </p>
              </div>
            </div>
          ) : !scriptLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading sky atlas...</p>
              </div>
            </div>
          ) : null}

          <div
            ref={containerRef}
            id="aladin-container"
            className="w-full h-full"
          />

          {selectedMarker && (
            <Card className="absolute top-4 right-4 z-20 w-72 shadow-lg">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm leading-tight pr-2">
                    {selectedMarker.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setSelectedMarker(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedMarker.thumbnailUrl && (
                  <img
                    src={selectedMarker.thumbnailUrl}
                    alt={selectedMarker.title}
                    className="w-full h-36 object-cover rounded-md mb-3"
                  />
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedMarker.objectType && (
                    <Badge variant="secondary">{selectedMarker.objectType}</Badge>
                  )}
                  {selectedMarker.constellation && (
                    <Badge variant="outline">{selectedMarker.constellation}</Badge>
                  )}
                </div>

                {selectedMarker.fieldOfView && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Field of view: {selectedMarker.fieldOfView}
                  </p>
                )}

                <Link
                  href={`/?search=${encodeURIComponent(selectedMarker.title)}`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Gallery
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
