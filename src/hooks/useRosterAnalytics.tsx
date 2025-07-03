
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
}

export interface CreatorAnalyticsData {
  creator_id: string;
  creator_name: string;
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views: number; // New: actual daily video views
  daily_engagement: number; // New: daily engagement metrics
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

      // Get YouTube analytics data for selected creators
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
        .gte('date_recorded', dateRange?.from?.toISOString().split('T')[0] || '2024-01-01')
        .lte('date_recorded', dateRange?.to?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0])
        .order('date_recorded', { ascending: true });

      if (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
      }

      console.log('Raw analytics data:', analyticsData);

      // Process aggregated data by date
      const dateMap = new Map<string, RosterAnalyticsData>();
      
      // Process individual creator data
      const creatorDataMap = new Map<string, CreatorAnalyticsData[]>();
      
      (analyticsData || []).forEach(item => {
        const date = item.date_recorded || '';
        if (!date) return;

        const creatorId = item.creator_roster_id;
        const creatorName = item.creator_roster?.creator_name || 'Unknown';

        // Aggregate data for charts
        const existing = dateMap.get(date) || {
          date,
          views: 0,
          engagement: 0,
          subscribers: 0,
          videosPosted: 0
        };

        existing.views += Number(item.views) || 0;
        existing.engagement += Number(item.likes || 0) + Number(item.comments || 0);
        existing.subscribers += Number(item.subscribers) || 0;
        dateMap.set(date, existing);

        // Individual creator data
        if (!creatorDataMap.has(creatorId)) {
          creatorDataMap.set(creatorId, []);
        }

        const creatorData = creatorDataMap.get(creatorId)!;
        const existingCreatorData = creatorData.find(d => d.date === date);

        if (existingCreatorData) {
          existingCreatorData.views += Number(item.views) || 0;
          existingCreatorData.engagement += Number(item.likes || 0) + Number(item.comments || 0);
          existingCreatorData.subscribers = Number(item.subscribers) || 0; // Latest value
          existingCreatorData.daily_views += Number(item.views) || 0;
          existingCreatorData.daily_engagement += Number(item.likes || 0) + Number(item.comments || 0);
        } else {
          creatorData.push({
            creator_id: creatorId,
            creator_name: creatorName,
            date,
            views: Number(item.views) || 0,
            engagement: Number(item.likes || 0) + Number(item.comments || 0),
            subscribers: Number(item.subscribers) || 0,
            daily_views: Number(item.views) || 0,
            daily_engagement: Number(item.likes || 0) + Number(item.comments || 0)
          });
        }
      });

      const processedData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Flatten creator data
      const flatCreatorData: CreatorAnalyticsData[] = [];
      creatorDataMap.forEach(creatorData => {
        flatCreatorData.push(...creatorData);
      });

      console.log('Processed analytics data:', processedData);
      console.log('Creator analytics data:', flatCreatorData);
      
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
      console.log('No user or creators provided for refresh:', { user: !!user, creatorIds });
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

      console.log('Creators data for refresh:', creatorsData);

      const refreshPromises = (creatorsData || []).map(async (creator) => {
        const channelLinks = creator.channel_links as any || {};
        const youtubeUrl = channelLinks.youtube;

        if (youtubeUrl) {
          console.log(`Refreshing YouTube data for ${creator.creator_name}:`, youtubeUrl);
          
          try {
            const { data: channelData, error: channelError } = await supabase.functions.invoke('fetch-channel-analytics', {
              body: { 
                creator_roster_id: creator.id,
                channel_url: youtubeUrl
              }
            });

            if (channelError) {
              console.error(`Error refreshing data for ${creator.creator_name}:`, channelError);
            } else {
              console.log(`Successfully refreshed data for ${creator.creator_name}:`, channelData);
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
        description: "Analytics data refreshed successfully",
      });

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
