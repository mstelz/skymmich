import { useState } from "react";
import { Plus, X, Edit3, Loader, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Equipment, ImageAcquisitionRow } from "@shared/schema";

interface AcquisitionEditorProps {
  imageId: number;
  onClose: () => void;
}

interface AcquisitionFormData {
  filterId: number | null;
  filterName: string;
  isCustomFilter: boolean;
  frameCount: string;
  exposureTime: string;
  gain: string;
  offset: string;
  binning: string;
  sensorTemp: string;
  date: string;
  notes: string;
}

const emptyForm: AcquisitionFormData = {
  filterId: null,
  filterName: "",
  isCustomFilter: false,
  frameCount: "",
  exposureTime: "",
  gain: "",
  offset: "",
  binning: "",
  sensorTemp: "",
  date: "",
  notes: "",
};

function formatIntegration(seconds: number): string {
  if (seconds >= 3600) {
    return `${(seconds / 3600).toFixed(1)}h`;
  }
  if (seconds >= 60) {
    return `${(seconds / 60).toFixed(0)}m`;
  }
  return `${seconds}s`;
}

export function AcquisitionEditor({ imageId, onClose }: AcquisitionEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AcquisitionFormData>(emptyForm);
  const queryClient = useQueryClient();

  // Fetch acquisition entries
  const { data: acquisitions = [], isLoading } = useQuery<ImageAcquisitionRow[]>({
    queryKey: ["/api/images", imageId, "acquisitions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/images/${imageId}/acquisitions`);
      return response.json();
    },
  });

  // Fetch filter equipment for the dropdown
  const { data: allEquipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/equipment");
      return response.json();
    },
  });

  const filters = allEquipment.filter(e => e.type === "filter");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/images/${imageId}/acquisitions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "acquisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setIsAdding(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/images/${imageId}/acquisitions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "acquisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setEditingId(null);
      setIsAdding(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/images/${imageId}/acquisitions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images", imageId, "acquisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    },
  });

  const handleSubmit = () => {
    const frameCount = parseInt(form.frameCount);
    const exposureTime = parseFloat(form.exposureTime);
    if (!frameCount || !exposureTime) return;

    const payload = {
      filterId: form.filterId || null,
      filterName: form.filterName || null,
      frameCount,
      exposureTime,
      gain: form.gain ? parseInt(form.gain) : null,
      offset: form.offset ? parseInt(form.offset) : null,
      binning: form.binning || null,
      sensorTemp: form.sensorTemp ? parseFloat(form.sensorTemp) : null,
      date: form.date || null,
      notes: form.notes || null,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (acq: ImageAcquisitionRow) => {
    const isCustom = !acq.filterId && !!acq.filterName;
    setEditingId(acq.id);
    setIsAdding(true);
    setForm({
      filterId: acq.filterId,
      filterName: acq.filterName || "",
      isCustomFilter: isCustom,
      frameCount: acq.frameCount.toString(),
      exposureTime: acq.exposureTime.toString(),
      gain: acq.gain?.toString() || "",
      offset: acq.offset?.toString() || "",
      binning: acq.binning || "",
      sensorTemp: acq.sensorTemp?.toString() || "",
      date: acq.date ? new Date(acq.date).toISOString().split("T")[0] : "",
      notes: acq.notes || "",
    });
  };

  const handleFilterSelect = (value: string) => {
    if (value === "none") {
      setForm(prev => ({ ...prev, filterId: null, filterName: "", isCustomFilter: false }));
    } else if (value === "custom") {
      setForm(prev => ({ ...prev, filterId: null, filterName: prev.filterName, isCustomFilter: true }));
    } else {
      const id = parseInt(value);
      const filter = filters.find(f => f.id === id);
      setForm(prev => ({
        ...prev,
        filterId: id,
        filterName: filter?.name || "",
        isCustomFilter: false,
      }));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // Computed summary
  const totalFrames = acquisitions.reduce((sum, a) => sum + a.frameCount, 0);
  const totalSeconds = acquisitions.reduce((sum, a) => sum + (a.frameCount * a.exposureTime), 0);
  const filterNames = [...new Set(acquisitions.map(a => a.filterName).filter(Boolean))];

  const mutationError = createMutation.error || updateMutation.error;

  // Determine the select value
  const filterSelectValue = form.filterId
    ? form.filterId.toString()
    : form.isCustomFilter
      ? "custom"
      : "none";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-lg p-6 max-w-3xl w-full mx-4 shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-400" />
            Acquisition Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Panel */}
        {acquisitions.length > 0 && (
          <div className="bg-black/30 rounded-lg p-3 mb-4 border border-gray-800">
            <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Total Frames:</span>
                <span className="text-white ml-2">{totalFrames}</span>
              </div>
              <div>
                <span className="text-gray-400">Integration:</span>
                <span className="text-white ml-2">{formatIntegration(totalSeconds)}</span>
              </div>
              <div>
                <span className="text-gray-400">Filters:</span>
                <span className="text-white ml-2">{filterNames.length > 0 ? filterNames.join(", ") : "None"}</span>
              </div>
              <div>
                <span className="text-gray-400">Entries:</span>
                <span className="text-white ml-2">{acquisitions.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Acquisition Entries */}
        <div className="space-y-2 mb-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-4">
              <Loader className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : acquisitions.length > 0 ? (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_80px_80px_70px_auto] gap-2 text-xs text-gray-400 font-medium px-2">
                <span>Filter</span>
                <span>Frames</span>
                <span>Exp (s)</span>
                <span>Total</span>
                <span>Gain/ISO</span>
                <span></span>
              </div>
              {acquisitions.map((acq) => (
                <div
                  key={acq.id}
                  className="grid grid-cols-[1fr_80px_80px_80px_70px_auto] gap-2 items-center bg-black/20 rounded-lg px-2 py-2 text-sm"
                >
                  <span className="text-white truncate">{acq.filterName || "No filter"}</span>
                  <span className="text-gray-300">{acq.frameCount}</span>
                  <span className="text-gray-300">{acq.exposureTime}</span>
                  <span className="text-gray-300">{formatIntegration(acq.frameCount * acq.exposureTime)}</span>
                  <span className="text-gray-300">{acq.gain ?? "-"}</span>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(acq)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(acq.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      disabled={deleteMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-4 text-center">
              No acquisition entries yet. Add your first sub-exposure details.
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {isAdding ? (
          <div className="space-y-3 p-3 bg-black/20 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300">
              {editingId !== null ? "Edit Entry" : "Add Entry"}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Filter selection */}
              <div className="col-span-2 space-y-2">
                <Label className="text-sm font-medium text-gray-300">Filter</Label>
                <Select
                  value={filterSelectValue}
                  onValueChange={handleFilterSelect}
                >
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white h-10">
                    <SelectValue placeholder="Select filter..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value="none">No Filter / Luminance</SelectItem>
                    {filters.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom name...</SelectItem>
                  </SelectContent>
                </Select>
                {form.isCustomFilter && (
                  <Input
                    type="text"
                    value={form.filterName}
                    onChange={(e) => setForm(prev => ({ ...prev, filterName: e.target.value }))}
                    placeholder="e.g., Ha, OIII, SII, L"
                    className="bg-gray-800 border-gray-700 text-white"
                    autoFocus
                  />
                )}
              </div>

              {/* Required fields */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Frames *</Label>
                <Input
                  type="number"
                  value={form.frameCount}
                  onChange={(e) => setForm(prev => ({ ...prev, frameCount: e.target.value }))}
                  placeholder="e.g., 60"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Exposure (seconds) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.exposureTime}
                  onChange={(e) => setForm(prev => ({ ...prev, exposureTime: e.target.value }))}
                  placeholder="e.g., 180"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Optional fields */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Gain / ISO</Label>
                <Input
                  type="number"
                  value={form.gain}
                  onChange={(e) => setForm(prev => ({ ...prev, gain: e.target.value }))}
                  placeholder="e.g., 100"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Offset</Label>
                <Input
                  type="number"
                  value={form.offset}
                  onChange={(e) => setForm(prev => ({ ...prev, offset: e.target.value }))}
                  placeholder="e.g., 50"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Binning</Label>
                <Input
                  type="text"
                  value={form.binning}
                  onChange={(e) => setForm(prev => ({ ...prev, binning: e.target.value }))}
                  placeholder="e.g., 1x1"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Sensor Temp</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.sensorTemp}
                  onChange={(e) => setForm(prev => ({ ...prev, sensorTemp: e.target.value }))}
                  placeholder="e.g., -10"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="text-sm font-medium text-gray-300">Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Preview */}
            {form.frameCount && form.exposureTime && (
              <div className="text-xs text-gray-400">
                {form.frameCount}x{form.exposureTime}s = {formatIntegration(parseInt(form.frameCount) * parseFloat(form.exposureTime))}
              </div>
            )}

            {/* Error display */}
            {mutationError && (
              <div className="text-xs text-red-400 bg-red-900/20 rounded px-2 py-1">
                Failed to save: {mutationError instanceof Error ? mutationError.message : "Unknown error"}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!form.frameCount || !form.exposureTime || createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingId !== null
                    ? "Update"
                    : "Save Entry"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-800 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
