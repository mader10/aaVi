import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Facebook } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertDownloadItem } from "@shared/schema";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const payload: InsertDownloadItem = { url };
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

    const fbUrlPattern = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)/;
    if (!fbUrlPattern.test(url)) {
      toast({
        title: "Invalid Facebook URL",
        description: "Please enter a valid Facebook video URL.",
        variant: "destructive",
      });
      return;
    }

    addUrlMutation.mutate(url);
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Facebook Videos</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Video URL
            </Label>
            <div className="relative">
              <Input
                type="url"
                id="videoUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.facebook.com/share/r/... or facebook.com/watch/?v=..."
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Facebook className="text-primary" size={16} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supports all Facebook video URL formats including shared links
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={addUrlMutation.isPending}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>{addUrlMutation.isPending ? "Adding..." : "Add to Download Queue"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
