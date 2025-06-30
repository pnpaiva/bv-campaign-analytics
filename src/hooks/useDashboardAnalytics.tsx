
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
        setMetrics(data[0]);
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
      fetchCampaignTrends(filters),
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
