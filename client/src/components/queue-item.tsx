import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  XCircle, 
  Download, 
  Play, 
  Trash2, 
  RefreshCw,
  TriangleAlert 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DownloadItem } from "@shared/schema";

interface QueueItemProps {
  item: DownloadItem;
}

export function QueueItem({ item }: QueueItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startDownloadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/downloads/${item.id}/start`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      toast({
        title: "Download started",
        description: "The video download has been initiated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error starting download",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/downloads/${item.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      toast({
        title: "Item removed",
        description: "The download item has been removed from the queue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    switch (item.status) {
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1" size={12} />
            Ready
          </Badge>
        );
      case "downloading":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="mr-1 animate-spin" size={12} />
            Downloading
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="mr-1" size={12} />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="mr-1" size={12} />
            Pending
          </Badge>
        );
    }
  };

  const handleDownload = () => {
    if (item.fileName) {
      window.open(`/downloads/${item.fileName}`, '_blank');
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {item.status === "failed" ? (
            <div className="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center">
              <TriangleAlert className="text-red-500" size={24} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <Download className="text-gray-400" size={20} />
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.title || "Facebook Video"}
            </p>
            {getStatusBadge()}
          </div>
          
          <p className="text-sm text-gray-500 truncate mb-2">
            {item.url}
          </p>
          
          {item.status === "downloading" && (
            <div className="space-y-2 mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progress: {item.progress}%</span>
                {item.downloadSpeed && <span>{item.downloadSpeed}</span>}
              </div>
              <Progress value={item.progress || 0} className="w-full h-2" />
            </div>
          )}
          
          {item.status === "failed" && item.errorMessage && (
            <p className="text-xs text-red-600 mb-2">
              {item.errorMessage}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {item.fileSize && <span>{item.fileSize}</span>}
              {item.duration && <span>{item.duration}</span>}
              {item.quality && <span>{item.quality}</span>}
            </div>
            
            <div className="flex items-center space-x-2">
              {item.status === "ready" && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="bg-success text-white hover:bg-green-600 transition-colors"
                >
                  <Download size={12} className="mr-1" />
                  Download MP4
                </Button>
              )}
              
              {item.status === "pending" && (
                <Button
                  onClick={() => startDownloadMutation.mutate()}
                  disabled={startDownloadMutation.isPending}
                  size="sm"
                  className="bg-primary text-white hover:bg-blue-600 transition-colors"
                >
                  <Play size={12} className="mr-1" />
                  {startDownloadMutation.isPending ? "Starting..." : "Start"}
                </Button>
              )}
              
              {item.status === "failed" && (
                <Button
                  onClick={() => startDownloadMutation.mutate()}
                  disabled={startDownloadMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry
                </Button>
              )}
              
              <Button
                onClick={() => deleteItemMutation.mutate()}
                disabled={deleteItemMutation.isPending}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
