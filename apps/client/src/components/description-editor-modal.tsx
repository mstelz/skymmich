import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BaseModal } from "./base-modal";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AstroImage } from "@shared/schema";

interface DescriptionEditorModalProps {
  image: AstroImage;
  onClose: () => void;
}

export function DescriptionEditorModal({ image, onClose }: DescriptionEditorModalProps) {
  const [description, setDescription] = useState(image.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/images/${image.id}`, {
        description: description.trim() || null
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/images", image.id] });
      onClose();
    } catch (error) {
      console.error("Failed to update description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(image.description || "");
    onClose();
  };

  return (
    <BaseModal onClose={handleCancel} title="Edit Description" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <Label htmlFor="description" className="text-white">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this image..."
            className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            rows={6}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
