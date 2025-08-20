import { useQuery } from "@tanstack/react-query";
import type { DownloadItem } from "@shared/schema";

export function useDownloads() {
  const query = useQuery<DownloadItem[]>({
    queryKey: ["/api/downloads"],
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  return {
    downloads: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
