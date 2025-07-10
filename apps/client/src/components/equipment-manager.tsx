import { useState } from "react";
import { Plus, X, Settings, Edit3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
    specifications: {} as Record<string, string>,
  });
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  
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
  const { data: allEquipment = [], isLoading: allEquipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/equipment");
      return response.json();
    },
  });

  // Add equipment to image
  const addEquipmentMutation = useMutation({
    mutationFn: async ({ equipmentId, settings, notes }: { equipmentId: number; settings?: any; notes?: string }) => {
      console.log('addEquipmentMutation.mutationFn called with:', { equipmentId, settings, notes });
      try {
        const response = await apiRequest("POST", `/api/images/${imageId}/equipment`, {
          equipmentId,
          settings,
          notes,
        });
        console.log('API response:', response);
        return response.json();
      } catch (error) {
        console.error('API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('addEquipmentMutation.onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "equipment"] });
      // Keep the form open for adding more equipment, but reset the form fields
      setSelectedEquipmentId(null);
      setSettings({});
      setNotes("");
    },
    onError: (error) => {
      console.error('addEquipmentMutation.onError called with:', error);
    },
  });

  // Quick add equipment mutation
  const quickAddEquipmentMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description: string; specifications: Record<string, string> }) => {
      const response = await apiRequest("POST", "/api/equipment", data);
      return response.json();
    },
    onSuccess: (newEquipment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      // Automatically add the new equipment to the image
      addEquipmentMutation.mutate({
        equipmentId: newEquipment.id,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        notes: notes.trim() || undefined,
      });
      setIsQuickAdding(false);
      setQuickAddForm({ name: "", type: "", description: "", specifications: {} });
      setSpecKey("");
      setSpecValue("");
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
    console.log('handleAddEquipment called');
    console.log('selectedEquipmentId:', selectedEquipmentId);
    console.log('settings:', settings);
    console.log('notes:', notes);
    
    if (selectedEquipmentId) {
      console.log('Calling addEquipmentMutation with:', {
        equipmentId: selectedEquipmentId,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        notes: notes.trim() || undefined,
      });
      
      addEquipmentMutation.mutate({
        equipmentId: selectedEquipmentId,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      console.log('No equipment selected');
    }
  };

  const handleQuickAddEquipment = () => {
    if (quickAddForm.name && quickAddForm.type) {
      quickAddEquipmentMutation.mutate({
        name: quickAddForm.name,
        type: quickAddForm.type,
        description: quickAddForm.description,
        specifications: quickAddForm.specifications,
      });
    }
  };

  const handleRemoveEquipment = (equipmentId: number) => {
    removeEquipmentMutation.mutate(equipmentId);
  };

  const handleUpdateSettings = (equipmentId: number, newSettings: any, newNotes: string) => {
    updateEquipmentMutation.mutate({
      equipmentId,
      settings: Object.keys(newSettings).length > 0 ? newSettings : undefined,
      notes: newNotes.trim() || undefined,
    });
  };

  // Filter out equipment that's already assigned
  const availableEquipment = allEquipment.filter(eq => 
    !currentEquipment.some(ce => ce.id === eq.id)
  );

  console.log('Equipment debugging:');
  console.log('allEquipment:', allEquipment);
  console.log('currentEquipment:', currentEquipment);
  console.log('availableEquipment:', availableEquipment);
  console.log('isAddingEquipment:', isAddingEquipment);
  console.log('selectedEquipmentId:', selectedEquipmentId);

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
        
        {/* Debug info */}
        <div className="text-xs text-gray-400 bg-black/20 p-2 rounded">
          <div>All Equipment: {allEquipment.length}</div>
          <div>Current Equipment: {currentEquipment.length}</div>
          <div>Available Equipment: {availableEquipment.length}</div>
          <div>Adding Equipment: {isAddingEquipment ? 'Yes' : 'No'}</div>
          <div>Selected ID: {selectedEquipmentId || 'None'}</div>
        </div>
        
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
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                value={quickAddForm.name}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., William Optics RedCat 51"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
              <select
                value={quickAddForm.type}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                required
              >
                <option value="">Choose type...</option>
                <option value="telescope">Telescope</option>
                <option value="camera">Camera</option>
                <option value="mount">Mount</option>
                <option value="filter">Filter</option>
                <option value="accessory">Accessory</option>
                <option value="software">Software</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
              <textarea
                value={quickAddForm.description}
                onChange={(e) => setQuickAddForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the equipment..."
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Specifications (optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="e.g., focalLength"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
                <input
                  type="text"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  placeholder="e.g., 250mm"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (specKey && specValue) {
                      setQuickAddForm(prev => ({
                        ...prev,
                        specifications: { ...prev.specifications, [specKey]: specValue }
                      }));
                      setSpecKey("");
                      setSpecValue("");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </Button>
              </div>
              {Object.keys(quickAddForm.specifications).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(quickAddForm.specifications).map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-xs">
                      {k}: {v}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Settings for this image (optional)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g., focalLength: 600"
                  value={settings.focalLength || ""}
                  onChange={(e) => setSettings((prev: Record<string, any>) => ({ ...prev, focalLength: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="e.g., aperture: f/6.3"
                  value={settings.aperture || ""}
                  onChange={(e) => setSettings((prev: Record<string, any>) => ({ ...prev, aperture: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes for this image (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific notes about how this equipment was used..."
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
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
                  setSpecKey("");
                  setSpecValue("");
                  setSettings({});
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Equipment</label>
              <select
                value={selectedEquipmentId || ""}
                onChange={(e) => setSelectedEquipmentId(Number(e.target.value) || null)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="">Choose equipment...</option>
                {availableEquipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedEquipmentId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Settings (optional)</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g., focalLength: 600"
                      value={settings.focalLength || ""}
                      onChange={(e) => setSettings((prev: Record<string, any>) => ({ ...prev, focalLength: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="e.g., aperture: f/6.3"
                      value={settings.aperture || ""}
                      onChange={(e) => setSettings((prev: Record<string, any>) => ({ ...prev, aperture: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific notes about how this equipment was used..."
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
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

  const handleSave = () => {
    onUpdate(settings, notes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSettings(equipment.settings || {});
    setNotes(equipment.notes || "");
    setIsEditing(false);
  };

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

          {!isEditing ? (
            <>
              {equipment.settings && Object.keys(equipment.settings).length > 0 && (
                <div className="mt-2 text-xs text-gray-300">
                  <span className="font-medium">Settings:</span>
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
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Settings</label>
                <input
                  type="text"
                  placeholder="focalLength"
                  value={settings.focalLength || ""}
                  onChange={(e) => setSettings((prev: Record<string, any>) => ({ ...prev, focalLength: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="text"
                  placeholder="aperture"
                  value={settings.aperture || ""}
                  onChange={(e) => setSettings((prev: Record<string, any>) => ({ ...prev, aperture: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs mt-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
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