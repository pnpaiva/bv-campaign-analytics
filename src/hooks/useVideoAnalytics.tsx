
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DateRange } from 'react-day-picker';

export interface VideoAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  videosPosted: number;
  daily_views: number;
  daily_engagement: number;
}

export interface CreatorVideoAnalyticsData {
  creator_id: string;
  creator_name: string;
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views: number;
  daily_engagement: number;
  videos_published: number;
}

export const useVideoAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<VideoAnalyticsData[]>([]);
  const [creatorAnalyticsData, setCreatorAnalyticsData] = useState<CreatorVideoAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchVideoAnalytics = useCallback(async (
    creatorIds: string[],
    dateRange?: DateRange,
    platform?: string
  ) => {
    if (!user || creatorIds.length === 0) {
      console.log('No user or creators provided:', { user: !!user, creatorIds });
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching video analytics for creators:', creatorIds);

      const fromDate = dateRange?.from?.toISOString().split('T')[0] || '2024-01-01';
      const toDate = dateRange?.to?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

      // Use the new database function to get daily video performance
      const { data: videoData, error } = await supabase.rpc('get_daily_video_performance', {
        p_creator_roster_ids: creatorIds,
        p_start_date: fromDate,
        p_end_date: toDate
      });

      if (error) {
        console.error('Error fetching video analytics:', error);
        throw error;
      }

      console.log('Raw video analytics data:', videoData);

      if (!videoData || videoData.length === 0) {
        console.log('No video analytics data found');
        setAnalyticsData([]);
        setCreatorAnalyticsData([]);
        return;
      }

      // Process aggregated data by date
      const dateMap = new Map<string, VideoAnalyticsData>();
      const creatorDataMap = new Map<string, CreatorVideoAnalyticsData[]>();

      videoData.forEach((item: any) => {
        const date = item.date_recorded || '';
        if (!date) return;

        const creatorId = item.creator_roster_id;
        const creatorName = item.creator_name || 'Unknown';
        const dailyViews = Math.max(0, Number(item.daily_views) || 0);
        const dailyEngagement = Math.max(0, Number(item.daily_engagement) || 0);
        const videosPublished = Math.max(0, Number(item.videos_published) || 0);
        const totalSubscribers = Math.max(0, Number(item.total_subscribers) || 0);

        console.log(`Processing ${creatorName} for ${date}:`, {
          dailyViews,
          dailyEngagement,
          videosPublished,
          totalSubscribers
        });

        // Aggregate daily data across all creators for each date
        const existing = dateMap.get(date) || {
          date,
          views: 0,
          engagement: 0,
          subscribers: 0,
          videosPosted: 0,
          daily_views: 0,
          daily_engagement: 0
        };

        existing.daily_views += dailyViews;
        existing.daily_engagement += dailyEngagement;
        existing.videosPosted += videosPublished;
        existing.views += dailyViews; // For compatibility
        existing.engagement += dailyEngagement; // For compatibility
        // Don't sum subscribers as they are totals, not daily changes
        dateMap.set(date, existing);

        // Individual creator data
        if (!creatorDataMap.has(creatorId)) {
          creatorDataMap.set(creatorId, []);
        }

        const creatorData = creatorDataMap.get(creatorId)!;
        creatorData.push({
          creator_id: creatorId,
          creator_name: creatorName,
          date,
          views: dailyViews,
          engagement: dailyEngagement,
          subscribers: totalSubscribers,
          daily_views: dailyViews,
          daily_engagement: dailyEngagement,
          videos_published: videosPublished
        });
      });

      const processedData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Flatten creator data
      const flatCreatorData: CreatorVideoAnalyticsData[] = [];
      creatorDataMap.forEach(creatorData => {
        flatCreatorData.push(...creatorData);
      });

      console.log('Final processed video analytics data:', processedData);
      console.log('Final creator video analytics data:', flatCreatorData);
      
      setAnalyticsData(processedData);
      setCreatorAnalyticsData(flatCreatorData);

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
  }, [user, toast]);

  const refreshVideoAnalytics = useCallback(async (creatorIds: string[]) => {
    if (!user || creatorIds.length === 0) {
      console.log('No user or creators provided for refresh:', { user: !!user, creatorIds });
      return;
    }

    setLoading(true);
    try {
      console.log('Refreshing video analytics for creators:', creatorIds);

      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creator_roster')
        .select('*')
        .eq('user_id', user.id)
        .in('id', creatorIds);

      if (creatorsError) throw creatorsError;

      console.log('Creators data for video refresh:', creatorsData);

      const refreshPromises = (creatorsData || []).map(async (creator) => {
        const channelLinks = creator.channel_links as any || {};
        const youtubeUrl = channelLinks.youtube;

        if (youtubeUrl) {
          console.log(`Refreshing video data for ${creator.creator_name}:`, youtubeUrl);
          
          try {
            const { data: videoData, error: videoError } = await supabase.functions.invoke('fetch-daily-video-analytics', {
              body: { 
                creator_roster_id: creator.id,
                channel_url: youtubeUrl
              }
            });

            if (videoError) {
              console.error(`Error refreshing video data for ${creator.creator_name}:`, videoError);
            } else {
              console.log(`Successfully refreshed video data for ${creator.creator_name}:`, videoData);
            }
          } catch (funcError) {
            console.error(`Function error for ${creator.creator_name}:`, funcError);
          }
        } else {
          console.log(`No YouTube URL found for ${creator.creator_name}`);
        }
      });

      await Promise.all(refreshPromises);

      toast({
        title: "Success",
        description: "Video analytics refreshed successfully",
      });

      // Wait a bit for the data to settle then refetch
      setTimeout(() => {
        fetchVideoAnalytics(creatorIds);
      }, 2000);

    } catch (error) {
      console.error('Error refreshing video analytics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh video analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchVideoAnalytics]);

  return {
    analyticsData,
    creatorAnalyticsData,
    loading,
    fetchVideoAnalytics,
    refreshVideoAnalytics
  };
};
