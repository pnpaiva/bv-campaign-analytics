
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DateRange } from 'react-day-picker';

export interface RosterAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
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
    if (!user || creatorIds.length === 0) return;

    setLoading(true);
    try {
      let query = supabase
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
        .in('creator_roster_id', creatorIds);

      // Apply date filtering
      if (dateRange?.from) {
        query = query.gte('date_recorded', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        query = query.lte('date_recorded', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date_recorded', { ascending: true });

      if (error) throw error;

      // Process data for chart
      const processedData = processAnalyticsData(data || []);
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

  const processAnalyticsData = (data: any[]): RosterAnalyticsData[] => {
    const dateMap = new Map<string, RosterAnalyticsData>();

    data.forEach(item => {
      const date = item.date_recorded;
      const existing = dateMap.get(date) || {
        date,
        views: 0,
        engagement: 0,
        subscribers: 0
      };

      existing.views += Number(item.views) || 0;
      // For channel analytics, use subscriber growth as engagement metric since 
      // likes/comments are not available at channel level
      existing.engagement += Number(item.subscribers) || 0;
      // Use the maximum subscribers count for the day (latest reading)
      existing.subscribers = Math.max(existing.subscribers, Number(item.subscribers) || 0);

      dateMap.set(date, existing);
    });

    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const refreshAnalyticsData = useCallback(async (creatorIds: string[]) => {
    if (!user || creatorIds.length === 0) return;

    setLoading(true);
    try {
      // Get creators with YouTube channels
      const { data: creators } = await supabase
        .from('creator_roster')
        .select('*')
        .eq('user_id', user.id)
        .in('id', creatorIds);

      if (!creators) return;

      // Fetch fresh data for each creator
      for (const creator of creators) {
        const channelLinks = creator.channel_links as any;
        const youtubeUrl = channelLinks?.youtube;
        
        if (youtubeUrl) {
          console.log(`Fetching fresh YouTube data for ${creator.creator_name}...`);
          
          const { data, error } = await supabase.functions.invoke('fetch-channel-analytics', {
            body: {
              creator_roster_id: creator.id,
              channel_url: youtubeUrl
            }
          });

          if (error) {
            console.error(`Error fetching data for ${creator.creator_name}:`, error);
          } else {
            console.log(`Successfully fetched data for ${creator.creator_name}:`, data);
          }
        }
      }

      toast({
        title: "Success",
        description: "Analytics data refreshed successfully",
      });

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
  }, [user, toast]);

  return {
    analyticsData,
    loading,
    fetchRosterAnalytics,
    refreshAnalyticsData
  };
};
