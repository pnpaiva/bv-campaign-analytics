
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

export const useRosterAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<RosterAnalyticsData[]>([]);
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

      // Get YouTube analytics data for ALL selected creators
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

      // Process the data by date - aggregate across ALL creators for each date
      const dateMap = new Map<string, RosterAnalyticsData>();
      
      (analyticsData || []).forEach(item => {
        const date = item.date_recorded || '';
        if (!date) return;

        const existing = dateMap.get(date) || {
          date,
          views: 0,
          engagement: 0,
          subscribers: 0,
          videosPosted: 0
        };

        // Sum up the data for each date across all creators
        existing.views += Number(item.views) || 0;
        existing.engagement += Number(item.likes || 0) + Number(item.comments || 0);
        
        // For subscribers, we want the sum across all creators for that date
        existing.subscribers += Number(item.subscribers) || 0;

        dateMap.set(date, existing);
      });

      const processedData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      console.log('Processed analytics data:', processedData);
      setAnalyticsData(processedData);

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

      // Get creator roster data with channel URLs
      const { data: creatorsData, error: creatorsError } = await supabase
        .from('creator_roster')
        .select('*')
        .eq('user_id', user.id)
        .in('id', creatorIds);

      if (creatorsError) throw creatorsError;

      console.log('Creators data for refresh:', creatorsData);

      // Process each creator with YouTube channel
      const refreshPromises = (creatorsData || []).map(async (creator) => {
        const channelLinks = creator.channel_links as any || {};
        const youtubeUrl = channelLinks.youtube;

        if (youtubeUrl) {
          console.log(`Refreshing YouTube data for ${creator.creator_name}:`, youtubeUrl);
          
          try {
            // Call the fetch-channel-analytics edge function
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

      // Wait for all refresh operations to complete
      await Promise.all(refreshPromises);

      toast({
        title: "Success",
        description: "Analytics data refreshed successfully",
      });

      // Wait a moment for the data to be processed, then refetch
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
    loading,
    fetchRosterAnalytics,
    refreshAnalyticsData
  };
};
