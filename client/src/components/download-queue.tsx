import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Video } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDownloads } from "@/hooks/use-downloads";
import { QueueItem } from "./queue-item";

export function DownloadQueue() {
  const { downloads, isLoading } = useDownloads();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bulkDownloadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/downloads/bulk", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      toast({
        title: "Bulk download started",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error starting bulk download",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingItems = downloads?.filter(item => item.status === "pending") || [];

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Download Queue</h2>
          {pendingItems.length > 0 && (
            <Button 
              onClick={() => bulkDownloadMutation.mutate()}
              disabled={bulkDownloadMutation.isPending}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Download size={16} />
              <span>{bulkDownloadMutation.isPending ? "Starting..." : "Download All"}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {downloads && downloads.length > 0 ? (
          downloads.map((item) => (
            <QueueItem key={item.id} item={item} />
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Video className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos in queue</h3>
            <p className="text-gray-500 mb-4">Add Facebook video URLs to start downloading</p>
          </div>
        )}
      </div>
    </Card>
  );
}
