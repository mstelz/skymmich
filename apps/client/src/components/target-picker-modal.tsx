import { useState, useEffect, useRef } from "react";
import { Loader, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BaseModal } from "./base-modal";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AstroImage } from "@shared/schema";

interface CatalogSearchResult {
  id: number;
  name: string;
  commonNames: string | null;
  type: string | null;
  messier: string | null;
}

interface TargetPickerModalProps {
  image: AstroImage;
  onClose: () => void;
}

export function TargetPickerModal({ image, onClose }: TargetPickerModalProps) {
  const [search, setSearch] = useState(image.targetName || "");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search || search.length < 1) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await apiRequest("GET", `/api/catalog/search?q=${encodeURIComponent(search)}`);
        const data = await response.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const handleSelect = async (name: string) => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/images/${image.id}`, { targetName: name });
      await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/images", image.id] });
      onClose();
    } catch (error) {
      console.error("Failed to set target name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/images/${image.id}`, { targetName: null });
      await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/images", image.id] });
      onClose();
    } catch (error) {
      console.error("Failed to clear target name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal onClose={onClose} title="Set Target Name" icon={<Target className="h-5 w-5 text-purple-400" />}>
      <div className="space-y-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search catalog (e.g. M 31, NGC 7000, Orion)..."
          className="bg-gray-800 border-gray-700 text-white"
          autoFocus
        />

        <div className="max-h-60 overflow-y-auto space-y-1">
          {isSearching && (
            <div className="flex items-center gap-2 text-gray-400 p-2">
              <Loader className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {!isSearching && results.length === 0 && search.length > 0 && (
            <div className="text-gray-500 text-sm p-2">
              No catalog matches. You can still set a custom target name.
            </div>
          )}
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.name)}
              disabled={isSaving}
              className="w-full text-left p-2 rounded hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{r.name}</span>
                  {r.messier && <span className="text-purple-400 ml-2 text-sm">({r.messier})</span>}
                </div>
                {r.type && <span className="text-gray-500 text-xs">{r.type}</span>}
              </div>
              {r.commonNames && (
                <div className="text-gray-400 text-xs mt-0.5">{r.commonNames}</div>
              )}
            </button>
          ))}
        </div>

        {search.trim() && !results.find(r => r.name === search.trim()) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelect(search.trim())}
            disabled={isSaving}
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Set custom target: "{search.trim()}"
          </Button>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-800">
          {image.targetName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isSaving}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Clear Target
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 ml-auto"
          >
            Cancel
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
