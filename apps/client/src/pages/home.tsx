import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { SearchFilters } from "@/components/search-filters";
import { ImageGallery } from "@/components/image-gallery";
import { Sidebar } from "@/components/sidebar";
import { ImageOverlay } from "@/components/image-overlay";
import { usePlateSolvingUpdates, useImmichSyncUpdates } from "@/hooks/use-socket";
import type { AstroImage, Equipment } from "@shared/schema";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<AstroImage | null>(null);
  const [filters, setFilters] = useState({
    objectType: "",
    tags: [] as string[],
    plateSolved: undefined as boolean | undefined,
    constellation: "",
    search: "",
  });
  const [visibleCount, setVisibleCount] = useState(12); // Show 12 images initially

  type Stats = { totalImages: number; plateSolved: number; totalHours: number; uniqueTargets: number; };
  type Tag = { tag: string; count: number };

  const { data: images = [], isLoading: imagesLoading, refetch: refetchImages } = useQuery<AstroImage[]>({
    queryKey: ["/api/images", filters.objectType, filters.tags, filters.plateSolved, filters.constellation],
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

  // Listen for real-time plate solving updates
  usePlateSolvingUpdates((update) => {
    console.log('Received plate solving update:', update);
    // Refresh data when plate solving status changes
    refetchImages();
    refetchStats();
  });

  // Listen for real-time Immich sync updates
  useImmichSyncUpdates((update) => {
    console.log('Received Immich sync update:', update);
    // Refresh data when Immich sync completes
    refetchImages();
    refetchStats();
  });

  const filteredImages = images.filter((image: AstroImage) => {
    if (filters.search && !image.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Reset visible count when filters change
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setVisibleCount(12); // Reset to initial count
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12); // Load 12 more images
  };

  // Get only the visible images based on pagination
  const visibleImages = filteredImages.slice(0, visibleCount);
  const hasMoreImages = visibleCount < filteredImages.length;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Header />
      <SearchFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        stats={stats}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full overflow-x-hidden">
        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1">
            <ImageGallery
              images={visibleImages}
              equipment={equipment}
              onImageClick={setSelectedImage}
              isLoading={imagesLoading}
              hasMoreImages={hasMoreImages}
              onLoadMore={handleLoadMore}
              totalImages={filteredImages.length}
              visibleCount={visibleCount}
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
        <ImageOverlay
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
