import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";
import { EquipmentSpecFields } from "@/components/equipment-spec-fields";
import { Edit3, Trash2, X, Plus, Users } from "lucide-react";
import type { Equipment, EquipmentGroup } from "@shared/schema";
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

        <EquipmentGroupsSection equipment={equipment} />
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
    cost: equipment.cost != null ? String(equipment.cost) : "",
    acquisitionDate: equipment.acquisitionDate ? new Date(equipment.acquisitionDate).toISOString().split('T')[0] : "",
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("PUT", `/api/equipment/${equipment.id}`, {
        ...data,
        cost: data.cost ? parseFloat(data.cost) : undefined,
        acquisitionDate: data.acquisitionDate || undefined,
      });
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
      cost: equipment.cost != null ? String(equipment.cost) : "",
      acquisitionDate: equipment.acquisitionDate ? new Date(equipment.acquisitionDate).toISOString().split('T')[0] : "",
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, specifications: {} }))}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Purchase Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="e.g., 499.99"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Acquisition Date</label>
              <input
                type="date"
                value={formData.acquisitionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                className="input w-full"
              />
            </div>
          </div>

          {formData.type && (
            <EquipmentSpecFields
              equipmentType={formData.type}
              specifications={formData.specifications}
              onChange={(specs) => setFormData(prev => ({ ...prev, specifications: specs }))}
            />
          )}

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
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div className="font-semibold text-lg">{equipment.name}</div>
              {equipment.cost != null && (
                <span className="text-xs text-gray-500"><span className="font-semibold">Cost:</span> ${equipment.cost.toFixed(2)}</span>
              )}
              {equipment.acquisitionDate && (
                <span className="text-xs text-gray-500"><span className="font-semibold">Acquired:</span> {new Date(equipment.acquisitionDate).toLocaleDateString()}</span>
              )}
            </div>
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
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data: { name: string; type: string; specifications: { [key: string]: string }; description: string; cost?: number; acquisitionDate?: string }): Promise<any> => {
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
        mutation.mutate({
          name, type, specifications: specs, description,
          cost: cost ? parseFloat(cost) : undefined,
          acquisitionDate: acquisitionDate || undefined,
        });
      }}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
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
              <label className="block text-sm font-medium mb-2 text-foreground">
                Purchase Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="e.g., 499.99"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Acquisition Date
              </label>
              <input
                type="date"
                value={acquisitionDate}
                onChange={e => setAcquisitionDate(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Equipment Type *
            </label>
            <Select
              value={type}
              onValueChange={(value) => { setType(value); setSpecs({}); }}
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

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the equipment..."
              className="input w-full resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Specifications */}
        {type && (
          <div className="mt-6">
            <EquipmentSpecFields
              equipmentType={type}
              specifications={specs}
              onChange={setSpecs}
            />
          </div>
        )}

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

// Equipment Groups Section
interface EquipmentGroupWithMembers extends EquipmentGroup {
  members: Equipment[];
}

function EquipmentGroupsSection({ equipment }: { equipment: Equipment[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: groups = [] } = useQuery<EquipmentGroupWithMembers[]>({
    queryKey: ["/api/equipment-groups"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/equipment-groups");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/equipment-groups/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-groups"] });
    },
  });

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Equipment Groups
        </h2>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {showAdd && (
        <AddGroupForm
          equipment={equipment}
          onClose={() => setShowAdd(false)}
        />
      )}

      {groups.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No equipment groups yet. Create one to quickly assign your gear setup to images.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) =>
            editingId === group.id ? (
              <EditGroupForm
                key={group.id}
                group={group}
                equipment={equipment}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={() => setEditingId(group.id)}
                onDelete={() => {
                  if (confirm(`Delete group "${group.name}"? This won't affect existing image assignments.`)) {
                    deleteMutation.mutate(group.id);
                  }
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  telescope: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  camera: "bg-green-600/20 text-green-400 border-green-600/30",
  mount: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  filter: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  accessory: "bg-gray-600/20 text-gray-400 border-gray-600/30",
  software: "bg-cyan-600/20 text-cyan-400 border-cyan-600/30",
};

function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: EquipmentGroupWithMembers;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-semibold text-lg">{group.name}</div>
          {group.description && (
            <div className="text-sm text-muted-foreground mt-1">{group.description}</div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {group.members.length === 0 ? (
              <span className="text-xs text-muted-foreground">No equipment in this group</span>
            ) : (
              group.members.map((eq) => (
                <span
                  key={eq.id}
                  className={`text-xs px-2 py-1 rounded border ${TYPE_COLORS[eq.type] || TYPE_COLORS.accessory}`}
                >
                  {eq.name}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
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
  );
}

function EquipmentMultiSelect({
  equipment,
  selectedIds,
  onChange,
}: {
  equipment: Equipment[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const selected = new Set(selectedIds);

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  // Group by type, de-emphasize filters
  const byType = equipment.reduce<Record<string, Equipment[]>>((acc, eq) => {
    (acc[eq.type] = acc[eq.type] || []).push(eq);
    return acc;
  }, {});

  const typeOrder = ["telescope", "camera", "mount", "accessory", "software", "filter"];
  const sortedTypes = typeOrder.filter((t) => byType[t]);

  return (
    <div className="space-y-3">
      {sortedTypes.map((type) => (
        <div key={type}>
          <div className="text-xs font-medium text-muted-foreground mb-1 capitalize">
            {type}s
            {type === "filter" && (
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (usually tracked in acquisition details)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {byType[type].map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => toggle(eq.id)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  selected.has(eq.id)
                    ? TYPE_COLORS[eq.type] || TYPE_COLORS.accessory
                    : "border-border text-muted-foreground hover:text-foreground"
                } ${type === "filter" ? "opacity-60" : ""}`}
              >
                {eq.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddGroupForm({
  equipment,
  onClose,
}: {
  equipment: Equipment[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; description: string; memberIds: number[] }) => {
      const res = await apiRequest("POST", "/api/equipment-groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-groups"] });
      onClose();
    },
  });

  return (
    <div className="bg-card border rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">New Equipment Group</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ name, description, memberIds });
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Group Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g., "Main Imaging Rig"'
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Equipment
            </label>
            <EquipmentMultiSelect
              equipment={equipment}
              selectedIds={memberIds}
              onChange={setMemberIds}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Button type="submit" disabled={mutation.isPending || !name} className="px-6">
            {mutation.isPending ? "Creating..." : "Create Group"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function EditGroupForm({
  group,
  equipment,
  onCancel,
}: {
  group: EquipmentGroupWithMembers;
  equipment: Equipment[];
  onCancel: () => void;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [memberIds, setMemberIds] = useState<number[]>(group.members.map((m) => m.id));
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/equipment-groups/${group.id}`, { name, description });
      await apiRequest("PUT", `/api/equipment-groups/${group.id}/members`, { memberIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-groups"] });
      onCancel();
    },
  });

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Group Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Equipment</label>
          <EquipmentMultiSelect
            equipment={equipment}
            selectedIds={memberIds}
            onChange={setMemberIds}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !name}
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}