import { useState } from "react";
import { Plus, X, Settings, Edit3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EquipmentSpecFields } from "@/components/equipment-spec-fields";
import type { Equipment } from "@shared/schema";

interface EquipmentWithDetails extends Equipment {
  settings?: any;
  notes?: string;
}

interface EquipmentManagerProps {
  imageId: number;
  onClose?: () => void;
}

export function EquipmentManager({ imageId, onClose }: EquipmentManagerProps) {
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  // Quick add form state
  const [quickAddForm, setQuickAddForm] = useState({
    name: "",
    type: "",
    description: "",
    specifications: {} as Record<string, any>,
  });

  // Settings key/value inputs
  const [settingsKey, setSettingsKey] = useState("");
  const [settingsValue, setSettingsValue] = useState("");

  const queryClient = useQueryClient();

  // Fetch current equipment for this image
  const { data: currentEquipment = [], isLoading: currentLoading } = useQuery<EquipmentWithDetails[]>({
    queryKey: ["/api/images", imageId, "equipment"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/images/${imageId}/equipment`);
      return response.json();
    },
  });

  // Fetch all available equipment
  const { data: allEquipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/equipment");
      return response.json();
    },
  });

  // Add equipment to image
  const addEquipmentMutation = useMutation({
    mutationFn: async ({ equipmentId, settings, notes }: { equipmentId: number; settings?: any; notes?: string }) => {
      const response = await apiRequest("POST", `/api/images/${imageId}/equipment`, {
        equipmentId,
        settings,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setSelectedEquipmentId(null);
      setSettings({});
      setNotes("");
    },
  });

  // Quick add equipment mutation
  const quickAddEquipmentMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description: string; specifications: Record<string, any> }) => {
      const response = await apiRequest("POST", "/api/equipment", data);
      return response.json();
    },
    onSuccess: (newEquipment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      addEquipmentMutation.mutate({
        equipmentId: newEquipment.id,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        notes: notes.trim() || undefined,
      });
      setIsQuickAdding(false);
      setQuickAddForm({ name: "", type: "", description: "", specifications: {} });
    },
  });

  // Remove equipment from image
  const removeEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      const response = await apiRequest("DELETE", `/api/images/${imageId}/equipment/${equipmentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    },
  });

  // Update equipment settings
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ equipmentId, settings, notes }: { equipmentId: number; settings?: any; notes?: string }) => {
      const response = await apiRequest("PUT", `/api/images/${imageId}/equipment/${equipmentId}`, {
        settings,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "equipment"] });
    },
  });

  const handleAddEquipment = () => {
    if (selectedEquipmentId) {
      addEquipmentMutation.mutate({
        equipmentId: selectedEquipmentId,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        notes: notes.trim() || undefined,
      });
    }
  };

  const handleQuickAddEquipment = () => {
    if (quickAddForm.name && quickAddForm.type) {
      // Clean specifications: remove undefined/empty values
      const cleanSpecs: Record<string, any> = {};
      for (const [k, v] of Object.entries(quickAddForm.specifications)) {
        if (v !== undefined && v !== "" && v !== null) {
          cleanSpecs[k] = v;
        }
      }
      quickAddEquipmentMutation.mutate({
        name: quickAddForm.name,
        type: quickAddForm.type,
        description: quickAddForm.description,
        specifications: cleanSpecs,
      });
    }
  };

  const handleRemoveEquipment = (equipmentId: number) => {
    removeEquipmentMutation.mutate(equipmentId);
  };

  const handleUpdateSettings = (equipmentId: number, newSettings: any, newNotes: string) => {
    updateEquipmentMutation.mutate({
      equipmentId,
      settings: Object.keys(newSettings).length > 0 ? newSettings : null,
      notes: newNotes.trim() || undefined,
    });
  };

  const addSetting = () => {
    if (settingsKey && settingsValue) {
      setSettings((prev: Record<string, any>) => ({ ...prev, [settingsKey]: settingsValue }));
      setSettingsKey("");
      setSettingsValue("");
    }
  };

  const removeSetting = (key: string) => {
    setSettings((prev: Record<string, any>) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Filter out equipment that's already assigned
  const availableEquipment = allEquipment.filter(eq =>
    !currentEquipment.some(ce => ce.id === eq.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Equipment Management</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Current Equipment */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Current Equipment</h4>
        {currentLoading ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : currentEquipment.length > 0 ? (
          <div className="space-y-2">
            {currentEquipment.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                onRemove={() => handleRemoveEquipment(equipment.id)}
                onUpdate={(settings, notes) => handleUpdateSettings(equipment.id, settings, notes)}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">No equipment assigned to this image.</div>
        )}
      </div>

      {/* Add Equipment */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Add Equipment</h4>

        {!isAddingEquipment && !isQuickAdding ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingEquipment(true)}
              className="text-white border-gray-600 hover:bg-gray-800"
              disabled={availableEquipment.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Existing ({availableEquipment.length} available)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickAdding(true)}
              className="text-white border-gray-600 hover:bg-gray-800"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Add New
            </Button>
          </div>
        ) : isQuickAdding ? (
          <div className="space-y-3 p-3 bg-black/20 rounded-lg border border-gray-700">
            <h5 className="text-sm font-medium text-gray-300">Quick Add New Equipment</h5>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Name *</Label>
              <Input
                type="text"
                value={quickAddForm.name}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., William Optics RedCat 51"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Type *</Label>
              <Select
                value={quickAddForm.type}
                onValueChange={(value) => setQuickAddForm(prev => ({ ...prev, type: value, specifications: {} }))}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-10">
                  <SelectValue placeholder="Choose type..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value="telescope">Telescope</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="mount">Mount</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Description (optional)</Label>
              <textarea
                value={quickAddForm.description}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the equipment..."
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
                rows={2}
              />
            </div>

            {quickAddForm.type && (
              <EquipmentSpecFields
                equipmentType={quickAddForm.type}
                specifications={quickAddForm.specifications}
                onChange={(specs) => setQuickAddForm(prev => ({ ...prev, specifications: specs }))}
              />
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Settings for this image (optional)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={settingsKey}
                  onChange={(e) => setSettingsKey(e.target.value)}
                  placeholder="e.g., focalLength"
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                />
                <Input
                  type="text"
                  value={settingsValue}
                  onChange={(e) => setSettingsValue(e.target.value)}
                  placeholder="e.g., 600mm"
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addSetting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </Button>
              </div>
              {Object.keys(settings).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(settings).map(([k, v]) => (
                    <Badge
                      key={k}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeSetting(k)}
                    >
                      {k}: {String(v)} <X className="h-3 w-3 ml-1 inline" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Notes for this image (optional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific notes about how this equipment was used..."
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleQuickAddEquipment}
                disabled={!quickAddForm.name || !quickAddForm.type || quickAddEquipmentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {quickAddEquipmentMutation.isPending ? "Creating..." : "Create & Add"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsQuickAdding(false);
                  setQuickAddForm({ name: "", type: "", description: "", specifications: {} });
                  setSettings({});
                  setSettingsKey("");
                  setSettingsValue("");
                  setNotes("");
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3 bg-black/20 rounded-lg border border-gray-700">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Select Equipment</Label>
              <Select
                value={selectedEquipmentId?.toString() || ""}
                onValueChange={(value) => setSelectedEquipmentId(Number(value) || null)}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-10">
                  <SelectValue placeholder="Choose equipment..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-[300px]">
                  <ScrollArea className="h-full w-full">
                    {availableEquipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id.toString()}>
                        {eq.name} ({eq.type})
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {selectedEquipmentId && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Settings (optional)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      value={settingsKey}
                      onChange={(e) => setSettingsKey(e.target.value)}
                      placeholder="e.g., focalLength"
                      className="flex-1 bg-gray-800 border-gray-700 text-white"
                    />
                    <Input
                      type="text"
                      value={settingsValue}
                      onChange={(e) => setSettingsValue(e.target.value)}
                      placeholder="e.g., 600mm"
                      className="flex-1 bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addSetting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add
                    </Button>
                  </div>
                  {Object.keys(settings).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(settings).map(([k, v]) => (
                        <Badge
                          key={k}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-destructive/20"
                          onClick={() => removeSetting(k)}
                        >
                          {k}: {String(v)} <X className="h-3 w-3 ml-1 inline" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Notes (optional)</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific notes about how this equipment was used..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddEquipment}
                disabled={!selectedEquipmentId || addEquipmentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addEquipmentMutation.isPending ? "Adding..." : "Add Equipment"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingEquipment(false);
                  setSelectedEquipmentId(null);
                  setSettings({});
                  setSettingsKey("");
                  setSettingsValue("");
                  setNotes("");
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface EquipmentCardProps {
  equipment: EquipmentWithDetails;
  onRemove: () => void;
  onUpdate: (settings: any, notes: string) => void;
}

function EquipmentCard({ equipment, onRemove, onUpdate }: EquipmentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState(equipment.settings || {});
  const [notes, setNotes] = useState(equipment.notes || "");
  const [editSettingsKey, setEditSettingsKey] = useState("");
  const [editSettingsValue, setEditSettingsValue] = useState("");

  const handleSave = () => {
    onUpdate(settings, notes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSettings(equipment.settings || {});
    setNotes(equipment.notes || "");
    setEditSettingsKey("");
    setEditSettingsValue("");
    setIsEditing(false);
  };

  const addEditSetting = () => {
    if (editSettingsKey && editSettingsValue) {
      setSettings((prev: Record<string, any>) => ({ ...prev, [editSettingsKey]: editSettingsValue }));
      setEditSettingsKey("");
      setEditSettingsValue("");
    }
  };

  const removeEditSetting = (key: string) => {
    setSettings((prev: Record<string, any>) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Show equipment specs in a compact format
  const specs = equipment.specifications as Record<string, any> | null;
  const specEntries = specs ? Object.entries(specs).filter(([, v]) => v !== undefined && v !== null && v !== "") : [];

  return (
    <div className="bg-black/30 rounded-lg p-3 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-400" />
            <h5 className="text-sm font-medium text-white">{equipment.name}</h5>
            <Badge variant="secondary" className="text-xs">
              {equipment.type}
            </Badge>
          </div>

          {equipment.description && (
            <p className="text-xs text-gray-400 mt-1">{equipment.description}</p>
          )}

          {/* Equipment specifications (from the equipment catalog) */}
          {specEntries.length > 0 && (
            <div className="mt-2 text-xs text-gray-300">
              <span className="font-medium text-gray-400">Specs:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {specEntries.map(([key, value]) => (
                  <span key={key} className="bg-gray-800/50 rounded px-1.5 py-0.5 text-gray-300">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isEditing ? (
            <>
              {equipment.settings && Object.keys(equipment.settings).length > 0 && (
                <div className="mt-2 text-xs text-gray-300">
                  <span className="font-medium">Image Settings:</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(equipment.settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {equipment.notes && (
                <p className="text-xs text-gray-400 mt-2 italic">"{equipment.notes}"</p>
              )}
            </>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-300">Image Settings</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={editSettingsKey}
                    onChange={(e) => setEditSettingsKey(e.target.value)}
                    placeholder="e.g., focalLength"
                    className="flex-1 bg-gray-800 border-gray-700 text-white h-8 text-xs"
                  />
                  <Input
                    type="text"
                    value={editSettingsValue}
                    onChange={(e) => setEditSettingsValue(e.target.value)}
                    placeholder="e.g., 600mm"
                    className="flex-1 bg-gray-800 border-gray-700 text-white h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addEditSetting}
                    className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                  >
                    Add
                  </Button>
                </div>
                {Object.keys(settings).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(settings).map(([k, v]) => (
                      <Badge
                        key={k}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeEditSetting(k)}
                      >
                        {k}: {String(v)} <X className="h-3 w-3 ml-1 inline" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-300">Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-white text-xs"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-2">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
              >
                ✓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
