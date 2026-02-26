import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";
import { Edit3, Trash2, X, Check } from "lucide-react";
import type { Equipment } from "@shared/schema";
import type { ReactNode } from "react";

export default function EquipmentCatalog(): React.JSX.Element {
  const { data, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/equipment");
      return res.json();
    },
  });
  const equipment: Equipment[] = Array.isArray(data) ? data : [];
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/equipment/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
    },
  });

  let equipmentList: ReactNode = null;
  if (equipment.length === 0) {
    equipmentList = <div className="text-center text-gray-500 py-8">No equipment found.</div>;
  } else {
    equipmentList = (
      <>
        {equipment.map((eq: Equipment) => {
          const specs = eq.specifications && typeof eq.specifications === 'object' && eq.specifications !== null 
            ? Object.entries(eq.specifications as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")
            : "";
          
          return (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              specs={specs}
              isEditing={editingId === eq.id}
              onEdit={() => setEditingId(eq.id)}
              onCancel={() => setEditingId(null)}
              onDelete={() => {
                if (confirm(`Are you sure you want to delete "${eq.name}"? This will also remove it from all images.`)) {
                  deleteMutation.mutate(eq.id);
                }
              }}
            />
          );
        })}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Equipment Catalog</h2>
          <Button onClick={() => setShowAdd(true)}>Add New Equipment</Button>
        </div>
        {showAdd && <AddEquipmentForm onClose={() => setShowAdd(false)} />}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-4">{equipmentList}</div>
        )}
      </div>
    </div>
  );
}

interface EquipmentCardProps {
  equipment: Equipment;
  specs: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function EquipmentCard({ equipment, specs, isEditing, onEdit, onCancel, onDelete }: EquipmentCardProps) {
  const [formData, setFormData] = useState({
    name: equipment.name,
    type: equipment.type,
    description: equipment.description || "",
    specifications: equipment.specifications as Record<string, string> || {},
  });
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("PUT", `/api/equipment/${equipment.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      onCancel();
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: equipment.name,
      type: equipment.type,
      description: equipment.description || "",
      specifications: equipment.specifications as Record<string, string> || {},
    });
    onCancel();
  };

  if (isEditing) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Equipment name"
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type *</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full bg-background border-input text-foreground h-10">
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

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description..."
              className="input w-full"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Specifications</label>
            <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex gap-3">
                <input 
                  value={specKey} 
                  onChange={e => setSpecKey(e.target.value)} 
                  placeholder="e.g., focalLength" 
                  className="input flex-1" 
                />
                <input 
                  value={specValue} 
                  onChange={e => setSpecValue(e.target.value)} 
                  placeholder="e.g., 250mm" 
                  className="input flex-1" 
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    if (specKey && specValue) {
                      setFormData(prev => ({
                        ...prev,
                        specifications: { ...prev.specifications, [specKey]: specValue }
                      }));
                      setSpecKey("");
                      setSpecValue("");
                    }
                  }}
                  className="px-4"
                  disabled={!specKey || !specValue}
                >
                  Add
                </Button>
              </div>
              
              {Object.keys(formData.specifications).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {Object.entries(formData.specifications).map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-xs">
                      {k}: {v}
                      <button
                        onClick={() => {
                          const newSpecs = { ...formData.specifications };
                          delete newSpecs[k];
                          setFormData(prev => ({ ...prev, specifications: newSpecs }));
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !formData.name || !formData.type}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold text-lg">{equipment.name}</div>
            <div className="text-sm text-gray-400">{equipment.type}</div>
            {equipment.description && <div className="text-sm mt-1">{equipment.description}</div>}
            {specs && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-semibold">Specs:</span> {specs}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEquipmentForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [specs, setSpecs] = useState<{ [key: string]: string }>({});
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data: { name: string; type: string; specifications: { [key: string]: string }; description: string }): Promise<any> => {
      const res = await apiRequest("POST", "/api/equipment", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      onClose();
    },
  });
  
  return (
    <div className="bg-card border rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Add New Equipment</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={e => {
        e.preventDefault();
        mutation.mutate({ name, type, specifications: specs, description });
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Equipment Name *
              </label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g., William Optics RedCat 51" 
                required 
                className="input w-full" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Equipment Type *
              </label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value)}
              >
                <SelectTrigger className="w-full bg-background border-input text-foreground h-10">
                  <SelectValue placeholder="Select equipment type..." />
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
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Brief description of the equipment..."
                className="input w-full resize-none" 
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Specifications
          </label>
          <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex gap-3">
              <input 
                value={specKey} 
                onChange={e => setSpecKey(e.target.value)} 
                placeholder="e.g., focalLength" 
                className="input flex-1" 
              />
              <input 
                value={specValue} 
                onChange={e => setSpecValue(e.target.value)} 
                placeholder="e.g., 250mm" 
                className="input flex-1" 
              />
              <Button 
                type="button" 
                onClick={() => {
                  if (specKey && specValue) {
                    setSpecs(prev => ({ ...prev, [specKey]: specValue }));
                    setSpecKey("");
                    setSpecValue("");
                  }
                }}
                className="px-4"
                disabled={!specKey || !specValue}
              >
                Add
              </Button>
            </div>
            
            {Object.keys(specs).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                {Object.entries(specs).map(([k, v]) => (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {k}: {v}
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = { ...specs };
                        delete newSpecs[k];
                        setSpecs(newSpecs);
                      }}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="submit" 
            disabled={mutation.isPending || !name || !type}
            className="px-6"
          >
            {mutation.isPending ? "Adding..." : "Add Equipment"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 