
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRosterAnalytics } from './useRosterAnalytics';

interface VideoAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views?: number;
  daily_engagement?: number;
  videosPosted?: number;
}

interface CreatorAnalyticsData {
  creator_id: string;
  creator_name: string;
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views: number;
  daily_engagement: number;
}

export const useVideoAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<VideoAnalyticsData[]>([]);
  const [creatorAnalyticsData, setCreatorAnalyticsData] = useState<CreatorAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshAllCreators } = useRosterAnalytics();

  const fetchVideoAnalytics = useCallback(async (
    creatorIds: string[],
    dateRange?: { from?: Date; to?: Date },
    platform?: string,
    forceRefresh: boolean = false
  ) => {
    console.log('Fetching video analytics for creators:', creatorIds);
    
    if (!creatorIds || creatorIds.length === 0) {
      console.log('No creator IDs provided');
      setAnalyticsData([]);
      setCreatorAnalyticsData([]);
      return;
    }

    setLoading(true);
    
    try {
      // Use the new SQL function for aggregated daily analytics
      const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.to || new Date();
      
      const { data: aggregatedData, error: aggError } = await supabase
        .rpc('get_roster_daily_analytics', {
          p_creator_ids: creatorIds,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0]
        });

      if (aggError) {
        console.error('Error fetching aggregated analytics:', aggError);
        throw aggError;
      }

      // Also get individual creator data for the table
      let individualQuery = supabase
        .from('youtube_analytics')
        .select(`
          *,
          creator_roster!inner(
            id,
            creator_name
          )
        `)
        .in('creator_roster_id', creatorIds)
        .order('date_recorded', { ascending: false });

      // Apply date filters
      if (dateRange?.from) {
        individualQuery = individualQuery.gte('date_recorded', dateRange.from.toISOString().split('T')[0]);
      } else {
        // Default to last 30 days
        individualQuery = individualQuery.gte('date_recorded', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }
      
      if (dateRange?.to) {
        individualQuery = individualQuery.lte('date_recorded', dateRange.to.toISOString().split('T')[0]);
      } else {
        individualQuery = individualQuery.lte('date_recorded', new Date().toISOString().split('T')[0]);
      }

      const { data: individualData, error: indError } = await individualQuery;

      if (indError) {
        console.error('Error fetching individual analytics:', indError);
        toast({
          title: "Error",
          description: "Failed to fetch individual analytics data",
          variant: "destructive",
        });
        return;
      }

      console.log('Aggregated analytics data:', aggregatedData);
      console.log('Individual analytics data:', individualData);

      // Process aggregated data for the dashboard overview
      const processedAnalytics = aggregatedData?.map((item: any) => ({
        date: item.date_recorded,
        views: Number(item.total_daily_views) || 0,
        engagement: Number(item.total_daily_engagement) || 0,
        subscribers: Number(item.total_daily_subscribers) || 0,
        daily_views: Number(item.total_daily_views) || 0,
        daily_engagement: Number(item.total_daily_engagement) || 0,
        videosPosted: 0 // We don't track this yet
      })) || [];
      
      // Process individual creator data for detailed analytics
      const creatorData = individualData?.map((item: any) => ({
        creator_id: item.creator_roster_id,
        creator_name: item.creator_roster?.creator_name || 'Unknown',
        date: item.date_recorded || new Date().toISOString().split('T')[0],
        views: Number(item.views) || 0,
        engagement: (Number(item.likes) || 0) + (Number(item.comments) || 0),
        subscribers: Number(item.subscribers) || 0,
        daily_views: Number(item.daily_views) || 0,
        daily_engagement: (Number(item.daily_likes) || 0) + (Number(item.daily_comments) || 0)
      })) || [];

      console.log('Processed analytics data:', processedAnalytics);
      console.log('Processed creator data:', creatorData);
      
      // Clear existing data first to ensure fresh state
      setAnalyticsData([]);
      setCreatorAnalyticsData([]);
      
      // Set new data with a small delay to ensure state update
      setTimeout(() => {
        setAnalyticsData(processedAnalytics);
        setCreatorAnalyticsData(creatorData);
      }, 100);
      
    } catch (error) {
      console.error('Error fetching video analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch video analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshVideoAnalytics = useCallback(async (creatorIds: string[]) => {
    console.log('Refreshing video analytics for creators:', creatorIds);
    
    try {
      // Get creators data to get their YouTube URLs
      const { data: creators, error: creatorsError } = await supabase
        .from('creator_roster')
        .select('*')
        .in('id', creatorIds);

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
        throw creatorsError;
      }

      console.log('Creators data for video refresh:', creators);

      if (!creators || creators.length === 0) {
        throw new Error('No creators found');
      }

      // Use the roster analytics refresh function which calls the YouTube API
      await refreshAllCreators(creators);
      
      toast({
        title: "Video Analytics Refresh Complete",
        description: `Successfully refreshed data for ${creators.length} creator${creators.length !== 1 ? 's' : ''}`,
      });

    } catch (error) {
      console.error('Error refreshing video analytics:', error);
      toast({
        title: "Refresh Error",
        description: error.message || 'Failed to refresh video analytics',
        variant: "destructive",
      });
      throw error;
    }
  }, [refreshAllCreators, toast]);

  return {
    analyticsData,
    creatorAnalyticsData,
    loading,
    fetchVideoAnalytics,
    refreshVideoAnalytics,
  };
};
