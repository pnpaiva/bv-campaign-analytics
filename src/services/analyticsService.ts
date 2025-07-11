import { supabase } from '@/integrations/supabase/client';
import { DateRange, RosterAnalyticsParams } from '@/types/analytics';

export class AnalyticsService {
  static async fetchAggregatedAnalytics(params: RosterAnalyticsParams) {
    const { data, error } = await supabase
      .rpc('get_roster_daily_analytics', params);

    if (error) {
      console.error('Error fetching aggregated analytics:', error);
      throw error;
    }

    return data;
  }

  static async fetchIndividualAnalytics(
    creatorIds: string[],
    dateRange?: DateRange
  ) {
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
      .order('date_recorded', { ascending: false });

    // Apply date filters
    if (dateRange?.from) {
      query = query.gte('date_recorded', dateRange.from.toISOString().split('T')[0]);
    } else {
      // Default to last 30 days
      query = query.gte('date_recorded', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
    
    if (dateRange?.to) {
      query = query.lte('date_recorded', dateRange.to.toISOString().split('T')[0]);
    } else {
      query = query.lte('date_recorded', new Date().toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching individual analytics:', error);
      throw error;
    }

    return data;
  }

  static async fetchCreatorsForRefresh(creatorIds: string[]) {
    const { data, error } = await supabase
      .from('creator_roster')
      .select('*')
      .in('id', creatorIds);

    if (error) {
      console.error('Error fetching creators:', error);
      throw error;
    }

    return data;
  }
}