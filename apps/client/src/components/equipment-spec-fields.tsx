import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EQUIPMENT_SPEC_FIELDS } from "@shared/schema";
import type { EquipmentType, SpecFieldDefinition } from "@shared/schema";

// Renders known specification fields for a given equipment type + custom key/value
export function EquipmentSpecFields({
  equipmentType,
  specifications,
  onChange,
  compact = false,
}: {
  equipmentType: string;
  specifications: Record<string, any>;
  onChange: (specs: Record<string, any>) => void;
  compact?: boolean;
}) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  const knownFields = EQUIPMENT_SPEC_FIELDS[equipmentType as EquipmentType] || [];
  const knownKeys = new Set(knownFields.map(f => f.key));
  const customEntries = Object.entries(specifications).filter(([k]) => !knownKeys.has(k));

  const updateField = (key: string, value: unknown) => {
    onChange({ ...specifications, [key]: value });
  };

  const removeField = (key: string) => {
    const next = { ...specifications };
    delete next[key];
    onChange(next);
  };

  const addCustom = () => {
    if (customKey && customValue) {
      onChange({ ...specifications, [customKey]: customValue });
      setCustomKey("");
      setCustomValue("");
    }
  };

  const inputSize = compact ? "h-8 text-xs" : "";
  const labelSize = compact ? "text-xs" : "text-sm";

  return (
    <div className="space-y-3">
      {knownFields.length > 0 && (
        <div className="space-y-2">
          {knownFields.map((field: SpecFieldDefinition) => (
            <div key={field.key} className="space-y-1">
              <Label className={`${labelSize} font-medium text-gray-300`}>
                {field.label}{field.unit ? ` (${field.unit})` : ""}
              </Label>
              {field.type === "number" && (
                <Input
                  type="number"
                  value={specifications[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value ? Number(e.target.value) : undefined)}
                  className={`bg-gray-800 border-gray-700 text-white ${inputSize}`}
                />
              )}
              {field.type === "text" && (
                <Input
                  type="text"
                  value={specifications[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value || undefined)}
                  className={`bg-gray-800 border-gray-700 text-white ${inputSize}`}
                />
              )}
              {field.type === "select" && field.options && (
                <Select
                  value={specifications[field.key] || ""}
                  onValueChange={(value) => updateField(field.key, value)}
                >
                  <SelectTrigger className={`w-full bg-gray-800 border-gray-600 text-white ${compact ? "h-8" : "h-10"}`}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type === "boolean" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!specifications[field.key]}
                    onCheckedChange={(checked) => updateField(field.key, !!checked)}
                    className="border-gray-600"
                  />
                  <span className={`${labelSize} text-gray-400`}>{specifications[field.key] ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom key/value entries */}
      <div className="space-y-2">
        <Label className={`${labelSize} font-medium text-gray-300`}>
          {knownFields.length > 0 ? "Additional Specifications" : "Specifications"}
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder="Name"
            className={`flex-1 bg-gray-800 border-gray-700 text-white ${inputSize}`}
          />
          <Input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Value"
            className={`flex-1 bg-gray-800 border-gray-700 text-white ${inputSize}`}
          />
          <Button
            type="button"
            size="sm"
            onClick={addCustom}
            className={`bg-blue-600 hover:bg-blue-700 ${compact ? "h-8 text-xs" : ""}`}
          >
            Add
          </Button>
        </div>
        {customEntries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customEntries.map(([k, v]) => (
              <Badge
                key={k}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => removeField(k)}
              >
                {k}: {String(v)} <X className="h-3 w-3 ml-1 inline" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
