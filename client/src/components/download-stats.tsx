import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Download } from "lucide-react";
import { useDownloads } from "@/hooks/use-downloads";

export function DownloadStats() {
  const { downloads } = useDownloads();

  if (!downloads) return null;

  const pendingCount = downloads.filter(d => d.status === "pending").length;
  const completedCount = downloads.filter(d => d.status === "ready").length;
  const totalSize = downloads
    .filter(d => d.fileSize)
    .reduce((acc, d) => {
      const size = parseFloat(d.fileSize?.replace(' MB', '') || '0');
      return acc + size;
    }, 0)
    .toFixed(1);

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-primary" size={16} />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-success" size={16} />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Download className="text-warning" size={16} />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{totalSize} MB</p>
              <p className="text-sm text-gray-500">Total Size</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
