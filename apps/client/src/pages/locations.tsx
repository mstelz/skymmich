import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { MapPicker } from "@/components/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Plus, Trash2, Edit3, X, Check, Loader } from "lucide-react";
import type { Location } from "@shared/schema";

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [editName, setEditName] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/locations");
      return response.json();
    },
  });

  const mapMarkers = locations
    .filter((loc) => loc.latitude != null && loc.longitude != null)
    .map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
      label: loc.name,
      id: loc.id,
    }));

  const handleMapPick = (lat: number, lng: number) => {
    setNewLat(lat.toFixed(6));
    setNewLng(lng.toFixed(6));
    if (!showAddForm) {
      setShowAddForm(true);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newLat || !newLng) return;
    setSaving(true);
    try {
      await apiRequest("POST", "/api/locations", {
        name: newName.trim(),
        latitude: parseFloat(newLat),
        longitude: parseFloat(newLng),
        altitude: newAlt ? parseFloat(newAlt) : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setShowAddForm(false);
      setNewName("");
      setNewLat("");
      setNewLng("");
      setNewAlt("");
    } catch (error) {
      console.error("Failed to create location:", error);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditLat(loc.latitude.toString());
    setEditLng(loc.longitude.toString());
    setEditAlt(loc.altitude?.toString() || "");
  };

  const handleUpdate = async () => {
    if (editingId == null || !editName.trim() || !editLat || !editLng) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/locations/${editingId}`, {
        name: editName.trim(),
        latitude: parseFloat(editLat),
        longitude: parseFloat(editLng),
        altitude: editAlt ? parseFloat(editAlt) : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update location:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await apiRequest("DELETE", `/api/locations/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    } catch (error) {
      console.error("Failed to delete location:", error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <MapPin className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Locations</h1>
              <p className="text-muted-foreground">Manage your observation locations</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="sky-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        {/* Map */}
        <Card className="mb-6">
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <MapPicker
              latitude={null}
              longitude={null}
              onChange={handleMapPick}
              height="400px"
              markers={mapMarkers}
            />
          </CardContent>
        </Card>

        {/* Add Location Form */}
        {showAddForm && (
          <Card className="mb-6 border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">New Location</CardTitle>
              <CardDescription>Click the map to pick coordinates, or enter them manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newName">Name</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Backyard Observatory"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newLat">Latitude</Label>
                  <Input
                    id="newLat"
                    type="number"
                    step="any"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    placeholder="45.0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newLng">Longitude</Label>
                  <Input
                    id="newLng"
                    type="number"
                    step="any"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    placeholder="-93.0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newAlt">Altitude (m)</Label>
                  <Input
                    id="newAlt"
                    type="number"
                    value={newAlt}
                    onChange={(e) => setNewAlt(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={saving || !newName.trim() || !newLat || !newLng}
                  className="sky-button-primary"
                >
                  {saving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Save Location
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No locations saved yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Location" or click on the map to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id} className="relative group">
                <CardContent className="p-4">
                  {editingId === loc.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Location name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          step="any"
                          value={editLat}
                          onChange={(e) => setEditLat(e.target.value)}
                          placeholder="Latitude"
                        />
                        <Input
                          type="number"
                          step="any"
                          value={editLng}
                          onChange={(e) => setEditLng(e.target.value)}
                          placeholder="Longitude"
                        />
                      </div>
                      <Input
                        type="number"
                        value={editAlt}
                        onChange={(e) => setEditAlt(e.target.value)}
                        placeholder="Altitude (optional)"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleUpdate} disabled={saving}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-semibold">{loc.name}</h3>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => startEdit(loc)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(loc.id)}
                            disabled={deleting === loc.id}
                          >
                            {deleting === loc.id ? (
                              <Loader className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground font-mono">
                        <div>{loc.latitude.toFixed(6)}°, {loc.longitude.toFixed(6)}°</div>
                        {loc.altitude != null && <div>Alt: {loc.altitude}m</div>}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
