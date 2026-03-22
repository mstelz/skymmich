import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export interface QueryFilters {
  objectType?: string;
  tags?: string[];
  plateSolved?: boolean;
  constellation?: string;
  equipmentId?: number;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [url, maybeFilters] = queryKey as [string, QueryFilters?];

    // Build query parameters from filters object (if present)
    const params = new URLSearchParams();
    if (maybeFilters && typeof maybeFilters === 'object' && !Array.isArray(maybeFilters)) {
      const filters = maybeFilters;
      if (filters.objectType) params.append('objectType', filters.objectType);
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }
      if (filters.plateSolved !== undefined) params.append('plateSolved', filters.plateSolved.toString());
      if (filters.constellation) params.append('constellation', filters.constellation);
      if (filters.equipmentId) params.append('equipmentId', filters.equipmentId.toString());
    }

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
