import axios from 'axios';
import { configService } from './config';
import { storage } from './storage';
import { filterRelevantTags } from './tags-utils';
import type { AstroImage } from '../../../../packages/shared/src/types';

class ImmichSyncService {
  /**
   * Filter image tags to only include meaningful ones for Immich.
   * Excludes individual star names from plate solving.
   * Keeps: catalog objects (NGC/IC/M/etc), 'astrophotography', named nebulae/objects.
   */
  private filterTagsForSync(tags: string[]): string[] {
    return filterRelevantTags(tags);
  }

  /**
   * Build tags list from Skymmich metadata (object type, constellation, equipment names)
   */
  private async buildMetadataTags(image: AstroImage): Promise<string[]> {
    const tags: string[] = [];

    if (image.objectType) tags.push(image.objectType);
    if (image.constellation) tags.push(image.constellation);

    try {
      const equipment = await storage.getEquipmentForImage(image.id);
      for (const eq of equipment) {
        tags.push(eq.name);
      }
    } catch { /* ignore */ }

    return tags;
  }

  /**
   * Build custom metadata key-value items from Skymmich data
   * These go into PUT /api/assets/{id}/metadata as { items: [...] }
   */
  private async buildMetadataItems(image: AstroImage): Promise<Array<{ key: string; value: object }>> {
    const items: Array<{ key: string; value: object }> = [];

    // Basic image info
    if (image.objectType) {
      items.push({ key: 'objectType', value: { value: image.objectType } });
    }
    if (image.constellation) {
      items.push({ key: 'constellation', value: { value: image.constellation } });
    }

    // Plate solving data
    if (image.ra !== null && image.ra !== undefined) {
      items.push({ key: 'ra', value: { value: String(image.ra) } });
    }
    if (image.dec !== null && image.dec !== undefined) {
      items.push({ key: 'dec', value: { value: String(image.dec) } });
    }
    if (image.pixelScale) {
      items.push({ key: 'pixelScale', value: { value: String(image.pixelScale) } });
    }
    if (image.fieldOfView) {
      items.push({ key: 'fieldOfView', value: { value: image.fieldOfView } });
    }
    if (image.rotation) {
      items.push({ key: 'rotation', value: { value: String(image.rotation) } });
    }

    // Camera/telescope info
    if (image.telescope) {
      items.push({ key: 'telescope', value: { value: image.telescope } });
    }
    if (image.camera) {
      items.push({ key: 'camera', value: { value: image.camera } });
    }
    if (image.mount) {
      items.push({ key: 'mount', value: { value: image.mount } });
    }
    if (image.focalLength) {
      items.push({ key: 'focalLength', value: { value: String(image.focalLength) } });
    }
    if (image.aperture) {
      items.push({ key: 'aperture', value: { value: image.aperture } });
    }
    if (image.iso) {
      items.push({ key: 'iso', value: { value: String(image.iso) } });
    }
    if (image.exposureTime) {
      items.push({ key: 'exposureTime', value: { value: image.exposureTime } });
    }
    if (image.filters) {
      items.push({ key: 'filters', value: { value: image.filters } });
    }
    if (image.frameCount) {
      items.push({ key: 'frameCount', value: { value: String(image.frameCount) } });
    }
    if (image.totalIntegration) {
      items.push({ key: 'totalIntegration', value: { value: `${image.totalIntegration}h` } });
    }

    // Equipment details
    try {
      const equipment = await storage.getEquipmentForImage(image.id);
      if (equipment.length > 0) {
        const eqSummary = equipment.map(e => `${e.name} (${e.type})`).join(', ');
        items.push({ key: 'equipment', value: { value: eqSummary } });
      }
    } catch { /* ignore */ }

    // Acquisition summary
    try {
      const acquisitions = await storage.getImageAcquisitions(image.id);
      if (acquisitions.length > 0) {
        const summary = acquisitions
          .map(a => `${a.filterName || 'No filter'}: ${a.frameCount}x${a.exposureTime}s`)
          .join(', ');
        const totalFrames = acquisitions.reduce((sum, a) => sum + a.frameCount, 0);
        const totalSeconds = acquisitions.reduce((sum, a) => sum + (a.frameCount * a.exposureTime), 0);
        const hours = (totalSeconds / 3600).toFixed(1);
        items.push({ key: 'acquisition', value: { value: `${summary} (${totalFrames} frames, ${hours}h)` } });
      }
    } catch { /* ignore */ }

    return items;
  }

  /**
   * Sync metadata for a single image to Immich
   */
  async syncImageMetadata(imageId: number): Promise<{ success: boolean; error?: string }> {
    const config = await configService.getImmichConfig();
    if (!config.host || !config.apiKey) {
      return { success: false, error: 'Immich is not configured. Please set the host URL and API key in Admin Settings.' };
    }
    if (!config.metadataSyncEnabled) {
      return { success: false, error: 'Metadata sync is disabled. Enable it in Admin Settings under "Metadata Sync".' };
    }

    const image = await storage.getAstroImage(imageId);
    if (!image || !image.immichId) {
      return { success: false, error: 'Image not found or not linked to Immich. Try syncing from Immich first.' };
    }

    try {
      const headers = { 'X-API-Key': config.apiKey };

      // 1. Update native asset fields via PUT /api/assets/{id}
      //    Supported: description, latitude, longitude, dateTimeOriginal, rating
      const assetPayload: Record<string, any> = {};
      if (config.syncDescription && image.description) {
        assetPayload.description = image.description;
      }
      if (config.syncCoordinates) {
        if (image.latitude !== null && image.latitude !== undefined) {
          assetPayload.latitude = image.latitude;
        }
        if (image.longitude !== null && image.longitude !== undefined) {
          assetPayload.longitude = image.longitude;
        }
      }

      if (Object.keys(assetPayload).length > 0) {
        await axios.put(
          `${config.host}/api/assets/${image.immichId}`,
          assetPayload,
          { headers }
        );
        console.log(`Updated asset fields for image ${imageId}: ${Object.keys(assetPayload).join(', ')}`);
      }

      // 2. Write custom astro metadata via PUT /api/assets/{id}/metadata
      const metadataItems = await this.buildMetadataItems(image);
      if (metadataItems.length > 0) {
        await axios.put(
          `${config.host}/api/assets/${image.immichId}/metadata`,
          { items: metadataItems },
          { headers }
        );
        console.log(`Wrote ${metadataItems.length} metadata items for image ${imageId}`);
      }

      // 3. Sync tags if enabled (filtered user tags + metadata-derived tags)
      if (config.syncTags) {
        const userTags = this.filterTagsForSync(image.tags || []);
        const metadataTags = await this.buildMetadataTags(image);
        const allTags = [...new Set([...userTags, ...metadataTags])];
        if (allTags.length > 0) {
          await this.syncTags(config.host, config.apiKey, image.immichId, allTags);
        }
      }

      console.log(`Synced metadata to Immich for image ${imageId} (asset ${image.immichId})`);
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data || error.message;
      console.error(`Failed to sync metadata for image ${imageId}:`, JSON.stringify(msg));
      return { success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    }
  }

  /**
   * Sync tags to Immich (creates tags if they don't exist, then assigns to asset)
   */
  private async syncTags(host: string, apiKey: string, immichAssetId: string, tags: string[]): Promise<void> {
    const headers = { 'X-API-Key': apiKey };

    // Fetch existing tags once
    let existingTags: Array<{ id: string; name: string }> = [];
    try {
      const listRes = await axios.get(`${host}/api/tags`, { headers });
      existingTags = listRes.data || [];
    } catch {
      console.warn('Failed to fetch existing Immich tags');
    }

    for (const tagName of tags) {
      try {
        let tagId: string | undefined;

        const existing = existingTags.find((t) => t.name === tagName);
        if (existing) {
          tagId = existing.id;
        } else {
          const createRes = await axios.post(
            `${host}/api/tags`,
            { name: tagName },
            { headers }
          );
          tagId = createRes.data?.id;
          if (tagId) {
            existingTags.push({ id: tagId, name: tagName });
          }
        }

        if (tagId) {
          await axios.put(
            `${host}/api/tags/${tagId}/assets`,
            { ids: [immichAssetId] },
            { headers }
          ).catch((e: any) => {
            console.warn(`Failed to assign tag "${tagName}":`, e.response?.status, JSON.stringify(e.response?.data));
          });
        }
      } catch (err: any) {
        console.warn(`Failed to sync tag "${tagName}":`, err.response?.status, JSON.stringify(err.response?.data) || err.message);
      }
    }
  }

  /**
   * Sync metadata for all images to Immich
   */
  async syncAllImages(): Promise<{ synced: number; failed: number; errors: string[] }> {
    const images = await storage.getAstroImages();
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const image of images) {
      if (!image.immichId) continue;

      const result = await this.syncImageMetadata(image.id);
      if (result.success) {
        synced++;
      } else {
        failed++;
        if (result.error) errors.push(`Image ${image.id}: ${result.error}`);
      }
    }

    return { synced, failed, errors };
  }
}

export const immichSyncService = new ImmichSyncService();
