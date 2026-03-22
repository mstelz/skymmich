import { useState } from "react";
import { ChevronRight, Info, Loader, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BaseModal } from "./base-modal";
import { MapPicker } from "./map-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AstroImage, Location } from "@shared/schema";

interface LocationEditorModalProps {
  image: AstroImage;
  onClose: () => void;
}

export function LocationEditorModal({ image, onClose }: LocationEditorModalProps) {
  const [latitude, setLatitude] = useState(image.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(image.longitude?.toString() || "");
  const [altitude, setAltitude] = useState(image.altitude?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [locationName, setLocationName] = useState("");

  const queryClient = useQueryClient();

  const { data: savedLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations");
      return response.json();
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const alt = altitude ? parseFloat(altitude) : null;

      if (isNaN(lat) || isNaN(lon)) {
        throw new Error("Invalid coordinates");
      }

      await apiRequest("PATCH", `/api/images/${image.id}`, {
        latitude: lat,
        longitude: lon,
        altitude: alt
      });

      if (saveAsNew && locationName.trim()) {
        await apiRequest("POST", "/api/locations", {
          name: locationName.trim(),
          latitude: lat,
          longitude: lon,
          altitude: alt
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/images", image.id] });
      onClose();
    } catch (error) {
      console.error("Failed to update location:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectLocation = (loc: Location) => {
    setLatitude(loc.latitude.toString());
    setLongitude(loc.longitude.toString());
    setAltitude(loc.altitude?.toString() || "");
  };

  return (
    <BaseModal onClose={onClose} title="Edit Location" icon={<MapPin className="h-5 w-5 text-green-400" />}>
      <div className="space-y-6">
        {savedLocations.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-300">Saved Locations</Label>
            <div className="grid grid-cols-1 gap-2">
              {savedLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{loc.name}</div>
                    <div className="text-xs text-gray-400">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">Pick on Map</Label>
          <MapPicker
            latitude={latitude ? parseFloat(latitude) : null}
            longitude={longitude ? parseFloat(longitude) : null}
            onChange={(lat, lng) => {
              setLatitude(lat.toFixed(6));
              setLongitude(lng.toFixed(6));
            }}
            height="200px"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-sm font-medium text-gray-300">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 34.0522"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-sm font-medium text-gray-300">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -118.2437"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="altitude" className="text-sm font-medium text-gray-300">Altitude (meters)</Label>
          <Input
            id="altitude"
            type="number"
            value={altitude}
            onChange={(e) => setAltitude(e.target.value)}
            placeholder="e.g. 350"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2">
            <Switch id="saveAsNew" checked={saveAsNew} onCheckedChange={setSaveAsNew} />
            <Label htmlFor="saveAsNew" className="text-sm text-gray-300">Save as a reusable location</Label>
          </div>

          {saveAsNew && (
            <div className="space-y-2">
              <Label htmlFor="locationName" className="text-sm font-medium text-gray-300">Location Name</Label>
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Backyard Observatory"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 bg-blue-900/20 p-3 rounded border border-blue-800/30 flex gap-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <p>Updating coordinates here will also sync them back to the original asset in Immich.</p>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !latitude || !longitude}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
          >
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Location"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
