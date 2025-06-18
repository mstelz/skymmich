interface ImmichAsset {
  id: string;
  originalFileName: string;
  fileCreatedAt: string;
  exifInfo?: {
    focalLength?: number;
    fNumber?: number;
    iso?: number;
    exposureTime?: string;
    make?: string;
    model?: string;
  };
}

interface ImmichApiConfig {
  baseUrl: string;
  apiKey: string;
}

export class ImmichApi {
  private config: ImmichApiConfig;

  constructor(config: ImmichApiConfig) {
    this.config = config;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Immich API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAssets(params: {
    take?: number;
    skip?: number;
    search?: string;
  } = {}): Promise<ImmichAsset[]> {
    const searchParams = new URLSearchParams();
    if (params.take) searchParams.append('take', params.take.toString());
    if (params.skip) searchParams.append('skip', params.skip.toString());
    if (params.search) searchParams.append('q', params.search);

    return this.request(`/api/assets?${searchParams.toString()}`);
  }

  async getAsset(id: string): Promise<ImmichAsset> {
    return this.request(`/api/assets/${id}`);
  }

  getAssetUrl(id: string, type: 'thumbnail' | 'original' = 'original'): string {
    return `${this.config.baseUrl}/api/assets/${id}/${type}`;
  }

  async searchAssets(query: string): Promise<ImmichAsset[]> {
    return this.request(`/api/search/assets`, {
      method: 'POST',
      body: JSON.stringify({ q: query }),
    });
  }
}

// Factory function to create Immich API instance from environment
export function createImmichApi(): ImmichApi | null {
  const baseUrl = import.meta.env.VITE_IMMICH_URL || "";
  const apiKey = import.meta.env.VITE_IMMICH_API_KEY || "";

  if (!baseUrl || !apiKey) {
    console.warn("Immich configuration missing. Set VITE_IMMICH_URL and VITE_IMMICH_API_KEY");
    return null;
  }

  return new ImmichApi({ baseUrl, apiKey });
}
