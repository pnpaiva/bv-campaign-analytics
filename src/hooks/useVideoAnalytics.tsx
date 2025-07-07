
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
    platform?: string
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
      console.log('Using youtube_analytics table for video analytics');
      
      let query = supabase
        .from('youtube_analytics')
        .select(`
          *,
          creator_roster!inner(
            id,
            creator_name
          )
        `)
        .in('creator_roster_id', creatorIds)
        .order('date_recorded', { ascending: true });

      // Don't show data from today or yesterday (max 2 days before today)
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() - 2);
      query = query.lte('date_recorded', maxDate.toISOString().split('T')[0]);

      if (dateRange?.from) {
        query = query.gte('date_recorded', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        const restrictedTo = new Date(Math.min(dateRange.to.getTime(), maxDate.getTime()));
        query = query.lte('date_recorded', restrictedTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching video analytics:', error);
        toast({
          title: "Error",
          description: "Failed to fetch video analytics data",
          variant: "destructive",
        });
        return;
      }

      console.log('Raw YouTube analytics data:', data);

      if (!data || data.length === 0) {
        console.log('No analytics data found');
        setAnalyticsData([]);
        setCreatorAnalyticsData([]);
        return;
      }

      // Process data for roster analytics table (aggregated by date)
      const aggregatedByDate = data.reduce((acc: Record<string, any>, item: any) => {
        const date = item.date_recorded || new Date().toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            date,
            views: 0,
            engagement: 0,
            subscribers: 0,
            daily_views: 0,
            daily_engagement: 0,
            videosPosted: 0
          };
        }
        
        // Use daily values for daily metrics, total values for current totals
        acc[date].daily_views += item.daily_views || 0;
        acc[date].daily_engagement += (item.daily_likes || 0) + (item.daily_comments || 0);
        acc[date].subscribers += item.daily_subscribers || 0; // Daily subscriber changes
        acc[date].views += item.daily_views || 0; // For roster table, show daily views
        acc[date].engagement += (item.daily_likes || 0) + (item.daily_comments || 0);
        
        return acc;
      }, {});

      const processedAnalytics = Object.values(aggregatedByDate) as VideoAnalyticsData[];
      
      // Process data for individual creator analytics
      const creatorData = data.map((item: any) => ({
        creator_id: item.creator_roster_id,
        creator_name: item.creator_roster?.creator_name || 'Unknown',
        date: item.date_recorded || new Date().toISOString().split('T')[0],
        views: item.views || 0,
        engagement: (item.likes || 0) + (item.comments || 0),
        subscribers: item.subscribers || 0,
        daily_views: item.daily_views || 0,
        daily_engagement: (item.daily_likes || 0) + (item.daily_comments || 0)
      }));

      console.log('Processed analytics data:', processedAnalytics);
      console.log('Processed creator data:', creatorData);
      
      setAnalyticsData(processedAnalytics);
      setCreatorAnalyticsData(creatorData);
      
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
