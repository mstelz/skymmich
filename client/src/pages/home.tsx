import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { SearchFilters } from "@/components/search-filters";
import { ImageGallery } from "@/components/image-gallery";
import { Sidebar } from "@/components/sidebar";
import { ImageModal } from "@/components/image-modal";
import type { AstroImage, Equipment } from "@shared/schema";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<AstroImage | null>(null);
  const [filters, setFilters] = useState({
    objectType: "",
    tags: [] as string[],
    plateSolved: undefined as boolean | undefined,
    search: "",
  });

  type Stats = { totalImages: number; plateSolved: number; totalHours: number; uniqueTargets: number; };
  type Tag = { tag: string; count: number };

  const { data: images = [], isLoading: imagesLoading, refetch: refetchImages } = useQuery<AstroImage[]>({
    queryKey: ["/api/images", filters.objectType, filters.tags, filters.plateSolved],
    enabled: true,
  });

  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: true,
  });

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    enabled: true,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
    enabled: true,
  });

  const filteredImages = images.filter((image: AstroImage) => {
    if (filters.search && !image.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSync = async () => {
    try {
      const response = await fetch("/api/sync-immich", { 
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        refetchImages();
        refetchStats();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSync={handleSync} />
      <SearchFilters 
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1">
            <ImageGallery
              images={filteredImages}
              equipment={equipment}
              onImageClick={setSelectedImage}
              isLoading={imagesLoading}
            />
          </main>
          
          <Sidebar 
            stats={stats}
            tags={tags}
            onTagClick={(tag) => {
              setFilters(prev => ({
                ...prev,
                tags: prev.tags.includes(tag) 
                  ? prev.tags.filter(t => t !== tag)
                  : [...prev.tags, tag]
              }));
            }}
          />
        </div>
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
