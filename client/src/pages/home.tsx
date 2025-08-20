import { UrlInput } from "@/components/url-input";
import { DownloadQueue } from "@/components/download-queue";
import { DownloadStats } from "@/components/download-stats";
import { useDownloads } from "@/hooks/use-downloads";
import { Facebook, Download, TriangleAlert, Code } from "lucide-react";

export default function Home() {
  const { downloads, isLoading } = useDownloads();

  const pendingCount = downloads?.filter(d => d.status === "pending").length || 0;
  const completedCount = downloads?.filter(d => d.status === "ready").length || 0;
  const totalSize = downloads?.filter(d => d.fileSize).reduce((acc, d) => {
    const size = parseFloat(d.fileSize?.replace(' MB', '') || '0');
    return acc + size;
  }, 0).toFixed(1) || '0';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Facebook className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Facebook Video Downloader</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Bulk Download Tool</span>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Download className="text-gray-600" size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <TriangleAlert className="text-amber-500 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
              <p className="text-sm text-amber-700 mt-1">
                This tool is for personal and educational use only. Please respect Facebook's Terms of Service and copyright laws. 
                Do not download or redistribute copyrighted or private content without permission.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* URL Input Section */}
          <div className="lg:col-span-1">
            <UrlInput />
            
            {/* Stats */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Videos in queue:</span>
                  <span className="font-medium text-gray-900">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-success">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total size:</span>
                  <span className="font-medium text-gray-900">{totalSize} MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Download Queue Section */}
          <div className="lg:col-span-2">
            <DownloadQueue />
            <DownloadStats />
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Supported URL Formats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• facebook.com/video/[video-id]</li>
                <li>• facebook.com/[user]/videos/[video-id]</li>
                <li>• facebook.com/watch/?v=[video-id]</li>
                <li>• facebook.com/share/r/[shared-id]</li>
                <li>• fb.watch/[shortened-url]</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Download Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic quality detection</li>
                <li>• Progress tracking & speed monitoring</li>
                <li>• Bulk download support</li>
                <li>• Error handling & retry mechanism</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Facebook Bulk Video Downloader - For educational purposes only
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">Powered by yt-dlp</span>
              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                <Code className="text-gray-500" size={12} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
