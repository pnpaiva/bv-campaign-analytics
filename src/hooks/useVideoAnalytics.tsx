

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

      // Query video_analytics table directly since the RPC function may not be available yet
      const { data: videoData, error } = await supabase
        .from('video_analytics')
        .select(`
          *,
          creator_roster!inner(
            id,
            creator_name,
            user_id
          )
        `)
        .eq('creator_roster.user_id', user.id)
        .in('creator_roster_id', creatorIds)
        .gte('published_at', fromDate)
        .lte('published_at', toDate)
        .order('published_at', { ascending: true });

      if (error) {
        console.error('Error fetching video analytics:', error);
        
        // Fallback to empty data if video_analytics table doesn't exist yet
        console.log('Video analytics table may not exist yet, showing empty state');
        setAnalyticsData([]);
        setCreatorAnalyticsData([]);
        return;
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
        const date = item.published_at?.split('T')[0] || '';
        if (!date) return;

        const creatorId = item.creator_roster_id;
        const creatorName = item.creator_roster?.creator_name || 'Unknown';
        const views = Math.max(0, Number(item.views) || 0);
        const engagement = Math.max(0, Number(item.likes || 0) + Number(item.comments || 0));

        console.log(`Processing ${creatorName} for ${date}:`, {
          views,
          engagement,
          title: item.title
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

        existing.daily_views += views;
        existing.daily_engagement += engagement;
        existing.videosPosted += 1;
        existing.views += views; // For compatibility
        existing.engagement += engagement; // For compatibility
        dateMap.set(date, existing);

        // Individual creator data
        if (!creatorDataMap.has(creatorId)) {
          creatorDataMap.set(creatorId, []);
        }

        const creatorData = creatorDataMap.get(creatorId)!;
        const existingCreatorEntry = creatorData.find(d => d.date === date);

        if (existingCreatorEntry) {
          existingCreatorEntry.views += views;
          existingCreatorEntry.engagement += engagement;
          existingCreatorEntry.daily_views += views;
          existingCreatorEntry.daily_engagement += engagement;
          existingCreatorEntry.videos_published += 1;
        } else {
          creatorData.push({
            creator_id: creatorId,
            creator_name: creatorName,
            date,
            views: views,
            engagement: engagement,
            subscribers: 0, // Will be populated from channel data later
            daily_views: views,
            daily_engagement: engagement,
            videos_published: 1
          });
        }
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
      
      // Show empty state instead of error to prevent UI breaking
      setAnalyticsData([]);
      setCreatorAnalyticsData([]);
      
      toast({
        title: "Video Analytics",
        description: "Video analytics feature is being set up. Please try refreshing the data.",
        variant: "default",
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
        description: "Video analytics refresh initiated. Data will be available shortly.",
      });

      // Wait a bit for the data to settle then refetch
      setTimeout(() => {
        fetchVideoAnalytics(creatorIds);
      }, 3000);

    } catch (error) {
      console.error('Error refreshing video analytics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh video analytics. Please try again later.",
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

