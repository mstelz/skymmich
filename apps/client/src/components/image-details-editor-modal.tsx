import { useState } from "react";
import { Edit3, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseModal } from "./base-modal";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AstroImage } from "@shared/schema";

interface ImageDetailsEditorModalProps {
  image: AstroImage;
  onClose: () => void;
}

export function ImageDetailsEditorModal({ image, onClose }: ImageDetailsEditorModalProps) {
  const [title, setTitle] = useState(image.title || "");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/images/${image.id}`, {
        title: title.trim()
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/images", image.id] });
      onClose();
    } catch (error) {
      console.error("Failed to update image details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal onClose={onClose} title="Edit Image Title" icon={<Edit3 className="h-5 w-5 text-blue-400" />}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-300">Display Name</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter image title..."
            className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <p className="text-xs text-gray-500">
            This is a visual rename. The original filename <code className="bg-gray-800 px-1 rounded">{image.filename}</code> remains unchanged for system linking.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800 mt-6">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || title === image.title}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Title"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
