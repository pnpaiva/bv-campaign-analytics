
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Heart, Youtube, Instagram } from "lucide-react";

interface CreatorMetricsProps {
  creatorName: string;
  platforms: {
    platform: string;
    views: number;
    engagement: number;
    subscribers: number;
    engagementRate: string;
  }[];
}

const CreatorMetrics = ({ creatorName, platforms }: CreatorMetricsProps) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'tiktok':
        return <span className="font-bold text-xs">T</span>;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{creatorName}</h3>
        <div className="flex gap-2 text-sm text-gray-600">
          {platforms.map((platform, index) => (
            <div key={index} className="flex items-center gap-1">
              {getPlatformIcon(platform.platform)}
              <span>{platform.platform}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((platform, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              {getPlatformIcon(platform.platform)}
              {platform.platform}
            </div>
            
            <div className="space-y-2">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-lg font-bold">{platform.subscribers.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Subscribers</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-lg font-bold">{platform.views.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-lg font-bold">{platform.engagement.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="text-lg font-bold text-green-600">{platform.engagementRate}%</div>
                <div className="text-xs text-gray-500">Engagement Rate</div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorMetrics;
