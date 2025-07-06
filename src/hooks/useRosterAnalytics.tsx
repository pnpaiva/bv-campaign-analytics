
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DateRange } from 'react-day-picker';

export interface RosterAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  videosPosted?: number;
  daily_views?: number;
  daily_engagement?: number;
}

export interface CreatorAnalyticsData {
  creator_id: string;
  creator_name: string;
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views: number;
  daily_engagement: number;
}

export const useRosterAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<RosterAnalyticsData[]>([]);
  const [creatorAnalyticsData, setCreatorAnalyticsData] = useState<CreatorAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRosterAnalytics = useCallback(async (
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
      console.log('Fetching roster analytics for creators:', creatorIds);

      const fromDate = dateRange?.from?.toISOString().split('T')[0] || '2024-01-01';
      const toDate = dateRange?.to?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

      const { data: analyticsData, error } = await supabase
        .from('youtube_analytics')
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
        .gte('date_recorded', fromDate)
        .lte('date_recorded', toDate)
        .order('date_recorded', { ascending: true });

      if (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
      }

      console.log('Raw analytics data:', analyticsData);

      if (!analyticsData || analyticsData.length === 0) {
        console.log('No analytics data found');
        setAnalyticsData([]);
        setCreatorAnalyticsData([]);
        return;
      }

      // Process data by date using the simplified structure
      const dateMap = new Map<string, RosterAnalyticsData>();
      const creatorDataMap = new Map<string, CreatorAnalyticsData[]>();
      
      analyticsData.forEach(item => {
        const date = item.date_recorded || '';
        if (!date) return;

        const creatorId = item.creator_roster_id;
        const creatorName = item.creator_roster?.creator_name || 'Unknown';

        const dailyViews = Math.max(0, Number(item.daily_views) || 0);
        const dailyEngagement = Math.max(0, Number(item.daily_likes || 0) + Number(item.daily_comments || 0));
        const dailySubscribers = Math.max(0, Number(item.daily_subscribers) || 0);

        // Aggregate daily data
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
        existing.subscribers += dailySubscribers;
        existing.views += dailyViews;
        existing.engagement += dailyEngagement;
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
          subscribers: Number(item.subscribers) || 0,
          daily_views: dailyViews,
          daily_engagement: dailyEngagement
        });
      });

      const processedData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const flatCreatorData: CreatorAnalyticsData[] = [];
      creatorDataMap.forEach(creatorData => {
        flatCreatorData.push(...creatorData);
      });

      console.log('Processed analytics data:', processedData);
      
      setAnalyticsData(processedData);
      setCreatorAnalyticsData(flatCreatorData);

    } catch (error) {
      console.error('Error fetching roster analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const refreshAnalyticsData = useCallback(async (creatorIds: string[]) => {
    if (!user || creatorIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      console.log('Refreshing analytics data for creators:', creatorIds);

      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creator_roster')
        .select('*')
        .eq('user_id', user.id)
        .in('id', creatorIds);

      if (creatorsError) throw creatorsError;

      const refreshPromises = (creatorsData || []).map(async (creator) => {
        const channelLinks = creator.channel_links as any || {};
        const youtubeUrl = channelLinks.youtube;

        if (youtubeUrl) {
          console.log(`Refreshing data for ${creator.creator_name}`);
          
          try {
            const { data, error } = await supabase.functions.invoke('fetch-daily-video-analytics', {
              body: { 
                creator_roster_id: creator.id,
                channel_url: youtubeUrl
              }
            });

            if (error) {
              console.error(`Error for ${creator.creator_name}:`, error);
            } else if (data && data.success) {
              console.log(`Success for ${creator.creator_name}:`, data);
            } else {
              console.error(`Failed for ${creator.creator_name}:`, data?.error);
            }
          } catch (funcError) {
            console.error(`Function error for ${creator.creator_name}:`, funcError);
          }
        }
      });

      await Promise.all(refreshPromises);

      toast({
        title: "Success",
        description: "Analytics data refreshed successfully",
      });

      // Refetch after a short delay
      setTimeout(() => {
        fetchRosterAnalytics(creatorIds);
      }, 2000);

    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchRosterAnalytics]);

  return {
    analyticsData,
    creatorAnalyticsData,
    loading,
    fetchRosterAnalytics,
    refreshAnalyticsData
  };
};
