
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Campaign } from "@/hooks/useCampaigns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, Instagram, ExternalLink, Calendar, DollarSign, Eye, Heart, MessageCircle, TrendingUp, Music } from "lucide-react";

interface CampaignDetailDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => Promise<void>;
  onRefreshAnalytics?: (campaign: Campaign) => Promise<void>;
}

interface AnalyticsData {
  id: string;
  platform: string;
  content_url: string;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
  engagement_rate: number;
  fetched_at: string;
}

export const CampaignDetailDialog = ({ 
  campaign, 
  open, 
  onOpenChange, 
  onEdit,
  onDelete,
  onRefreshAnalytics 
}: CampaignDetailDialogProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign && open) {
      fetchAnalyticsData();
    }
  }, [campaign, open]);

  const fetchAnalyticsData = async () => {
    if (!campaign) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('fetched_at', { ascending: false });

      if (error) throw error;
      setAnalyticsData(data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'tiktok':
        return <Music className="h-4 w-4 text-black" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaign.brand_name}
            <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
              {campaign.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{formatDate(campaign.campaign_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Deal Value</p>
                    <p className="font-medium">{campaign.deal_value ? `$${formatNumber(campaign.deal_value)}` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="font-medium">{formatNumber(campaign.total_views)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                    <p className="font-medium">{campaign.engagement_rate}%</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Creator</p>
                <p className="font-medium">{campaign.creators?.name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading analytics data...</div>
              ) : analyticsData.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.map((data) => (
                    <div key={data.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(data.platform)}
                          <span className="font-medium capitalize">{data.platform}</span>
                        </div>
                        <a
                          href={data.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Views</p>
                          <p className="font-medium">{formatNumber(data.views)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Likes</p>
                          <p className="font-medium">{formatNumber(data.likes)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Comments</p>
                          <p className="font-medium">{formatNumber(data.comments)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Engagement</p>
                          <p className="font-medium">{formatNumber(data.engagement)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Engagement Rate</p>
                          <p className="font-medium">{data.engagement_rate.toFixed(2)}%</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Last updated: {new Date(data.fetched_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No analytics data available for this campaign
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end gap-2">
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(campaign)}>
              Edit
            </Button>
          )}
          {onRefreshAnalytics && (
            <Button variant="outline" onClick={() => onRefreshAnalytics(campaign)}>
              Refresh Analytics
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={() => onDelete(campaign)}>
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
