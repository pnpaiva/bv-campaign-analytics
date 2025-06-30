
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  creatorIds?: string[];
  clientIds?: string[];
  campaignIds?: string[];
  platforms?: string[];
}

export interface DashboardMetrics {
  total_campaigns: number;
  total_views: number;
  total_engagement: number;
  avg_engagement_rate: number;
  total_deal_value: number;
  platform_breakdown: Record<string, any>;
  creator_performance: Record<string, any>;
  monthly_trends: Record<string, any>;
}

export interface CampaignTrend {
  period: string;
  total_views: number;
  total_engagement: number;
  campaign_count: number;
  avg_engagement_rate: number;
}

export interface TopContent {
  campaign_id: string;
  brand_name: string;
  creator_name: string;
  platform: string;
  content_url: string;
  views: number;
  engagement: number;
  engagement_rate: number;
  campaign_date: string;
}

export const useDashboardAnalytics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<CampaignTrend[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDashboardMetrics = async (filters: DashboardFilters = {}) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        creator_ids: filters.creatorIds || null,
        client_ids: filters.clientIds || null,
        campaign_ids: filters.campaignIds || null,
        platforms: filters.platforms || null,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const rawData = data[0];
        // Cast Json types to Record<string, any>
        const processedMetrics: DashboardMetrics = {
          total_campaigns: rawData.total_campaigns,
          total_views: rawData.total_views,
          total_engagement: rawData.total_engagement,
          avg_engagement_rate: rawData.avg_engagement_rate,
          total_deal_value: rawData.total_deal_value,
          platform_breakdown: rawData.platform_breakdown as Record<string, any>,
          creator_performance: rawData.creator_performance as Record<string, any>,
          monthly_trends: rawData.monthly_trends as Record<string, any>,
        };
        setMetrics(processedMetrics);
        
        // Convert monthly trends to trends array format
        const monthlyTrendsArray = Object.entries(processedMetrics.monthly_trends).map(([month, data]: [string, any]) => ({
          period: month,
          total_views: data.views || 0,
          total_engagement: data.engagement || 0,
          campaign_count: data.campaigns || 0,
          avg_engagement_rate: data.views > 0 ? ((data.engagement || 0) / data.views) * 100 : 0,
        }));
        setTrends(monthlyTrendsArray);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard metrics",
        variant: "destructive",
      });
    }
  };

  const fetchCampaignTrends = async (filters: DashboardFilters = {}, groupBy: 'day' | 'week' | 'month' = 'month') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_campaign_trends', {
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        group_by_period: groupBy,
      });

      if (error) throw error;
      setTrends(data || []);
    } catch (error) {
      console.error('Error fetching campaign trends:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign trends",
        variant: "destructive",
      });
    }
  };

  const fetchTopContent = async (limitCount: number = 10, orderBy: 'views' | 'engagement' | 'engagement_rate' = 'views') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_top_content', {
        limit_count: limitCount,
        order_by: orderBy,
      });

      if (error) throw error;
      setTopContent(data || []);
    } catch (error) {
      console.error('Error fetching top content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch top content",
        variant: "destructive",
      });
    }
  };

  const refreshData = async (filters: DashboardFilters = {}) => {
    setLoading(true);
    await Promise.all([
      fetchDashboardMetrics(filters),
      fetchTopContent()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  return {
    metrics,
    trends,
    topContent,
    loading,
    refreshData,
    fetchDashboardMetrics,
    fetchCampaignTrends,
    fetchTopContent,
  };
};
