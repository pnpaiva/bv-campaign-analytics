
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
      // Build date filter conditions
      let dateFilter = '';
      const params: any[] = [user.id];
      
      if (dateRange?.from) {
        dateFilter += ' AND ya.date_recorded >= $' + (params.length + 1);
        params.push(dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        dateFilter += ' AND ya.date_recorded <= $' + (params.length + 1);
        params.push(dateRange.to.toISOString().split('T')[0]);
      }

      // Simple query using our new view and raw data
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
        .gte('date_recorded', dateRange?.from?.toISOString().split('T')[0] || '2025-06-01')
        .lte('date_recorded', dateRange?.to?.toISOString().split('T')[0] || '2025-12-31')
        .order('date_recorded', { ascending: true });

      if (error) throw error;

      // Simple data processing - group by date and sum
      const dateMap = new Map<string, RosterAnalyticsData>();
      
      (analyticsData || []).forEach(item => {
        const date = item.date_recorded || '';
        const existing = dateMap.get(date) || {
          date,
          views: 0,
          engagement: 0,
          subscribers: 0
        };

        // Sum views, use subscribers as engagement, take max subscribers
        existing.views += Number(item.views) || 0;
        existing.engagement += Number(item.subscribers) || 0; // Use subscribers as engagement metric
        existing.subscribers = Math.max(existing.subscribers, Number(item.subscribers) || 0);

        dateMap.set(date, existing);
      });

      setAnalyticsData(Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));

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
    if (!user || creatorIds.length === 0) return;

    setLoading(true);
    try {
      // Get the latest data from our summary view to update today's records
      const { data: summaryData, error: summaryError } = await supabase
        .from('roster_analytics_summary')
        .select('*')
        .eq('user_id', user.id)
        .in('creator_roster_id', creatorIds);

      if (summaryError) throw summaryError;

      if (summaryData && summaryData.length > 0) {
        // Update today's data for each creator using the SQL function
        for (const creator of summaryData) {
          const { error: updateError } = await supabase
            .rpc('refresh_creator_youtube_data', {
              p_creator_roster_id: creator.creator_roster_id,
              p_subscribers: creator.current_subscribers,
              p_views: creator.current_views,
              p_engagement_rate: creator.current_engagement_rate
            });

          if (updateError) {
            console.error(`Error updating data for ${creator.creator_name}:`, updateError);
          } else {
            console.log(`Successfully updated data for ${creator.creator_name}`);
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
