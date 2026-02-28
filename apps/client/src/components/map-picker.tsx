import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange?: (lat: number, lng: number) => void;
  height?: string;
  readonly?: boolean;
  markers?: Array<{ lat: number; lng: number; label?: string; id?: number }>;
  onMarkerClick?: (id: number) => void;
}

export function MapPicker({
  latitude,
  longitude,
  onChange,
  height = "300px",
  readonly = false,
  markers,
  onMarkerClick,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultLat = latitude ?? 45;
    const defaultLng = longitude ?? 0;
    const defaultZoom = latitude != null ? 10 : 3;

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Add initial marker if coordinates provided
    if (latitude != null && longitude != null && !markers) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }

    // Click handler for picking location
    if (!readonly && onChange) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        onChange(lat, lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update marker position when lat/lng props change (not from click)
  useEffect(() => {
    if (!mapInstanceRef.current || markers) return;
    if (latitude != null && longitude != null) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
    }
  }, [latitude, longitude, markers]);

  // Update multiple markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !markers) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng]);
      if (m.label) {
        marker.bindPopup(m.label);
        marker.bindTooltip(m.label, { permanent: false });
      }
      if (m.id != null && onMarkerClick) {
        marker.on("click", () => onMarkerClick(m.id!));
      }
      markersLayerRef.current!.addLayer(marker);
    });

    // Fit bounds if there are markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [markers, onMarkerClick]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: "0.5rem" }}
      className="z-0"
    />
  );
}
