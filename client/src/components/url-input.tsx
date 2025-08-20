import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Video, Music } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertDownloadItem } from "@shared/schema";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const [downloadType, setDownloadType] = useState("video");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addUrlMutation = useMutation({
    mutationFn: async (data: { url: string; downloadType: string }) => {
      const payload: InsertDownloadItem = { url: data.url, downloadType: data.downloadType };
      const response = await apiRequest("POST", "/api/downloads", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      setUrl("");
      toast({
        title: "URL added successfully",
        description: "The video has been added to your download queue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding URL",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Please enter a URL",
        description: "You must provide a Facebook video URL.",
        variant: "destructive",
      });
      return;
    }

    const socialMediaPattern = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|instagram\.com|youtube\.com|youtu\.be)/;
    if (!socialMediaPattern.test(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Facebook, Instagram, or YouTube video URL.",
        variant: "destructive",
      });
      return;
    }

    addUrlMutation.mutate({ url, downloadType });
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Social Media Content</h2>
        
        <Tabs defaultValue="video" value={downloadType} onValueChange={setDownloadType} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video" className="flex items-center space-x-2">
              <Video size={16} />
              <span>Video</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center space-x-2">
              <Music size={16} />
              <span>Audio</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
              {downloadType === "audio" ? "Audio URL" : "Video URL"}
            </Label>
            <div className="relative">
              <Input
                type="url"
                id="videoUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={downloadType === "audio" 
                  ? "Extract audio from Facebook, Instagram, or YouTube" 
                  : "Facebook, Instagram, or YouTube video URL"
                }
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {downloadType === "audio" ? (
                  <Music className="text-primary" size={16} />
                ) : (
                  <Video className="text-primary" size={16} />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {downloadType === "audio" 
                ? "Downloads audio as MP3 format from any video URL"
                : "Supports Facebook, Instagram, and YouTube video formats"
              }
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={addUrlMutation.isPending}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>
              {addUrlMutation.isPending 
                ? "Adding..." 
                : `Add ${downloadType === "audio" ? "Audio" : "Video"} to Queue`
              }
            </span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
