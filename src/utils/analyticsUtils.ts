import { VideoAnalyticsData, CreatorAnalyticsData } from '@/types/analytics';

export class AnalyticsUtils {
  static processAggregatedData(aggregatedData: any[]): VideoAnalyticsData[] {
    return aggregatedData?.map((item: any) => ({
      date: item.date_recorded,
      views: Number(item.total_daily_views) || 0,
      engagement: Number(item.total_daily_engagement) || 0,
      subscribers: Number(item.total_daily_subscribers) || 0,
      daily_views: Number(item.total_daily_views) || 0,
      daily_engagement: Number(item.total_daily_engagement) || 0,
      videosPosted: 0 // We don't track this yet
    })) || [];
  }

  static processIndividualData(individualData: any[]): CreatorAnalyticsData[] {
    return individualData?.map((item: any) => ({
      creator_id: item.creator_roster_id,
      creator_name: item.creator_roster?.creator_name || 'Unknown',
      date: item.date_recorded || new Date().toISOString().split('T')[0],
      views: Number(item.views) || 0,
      engagement: (Number(item.likes) || 0) + (Number(item.comments) || 0),
      subscribers: Number(item.subscribers) || 0,
      daily_views: Number(item.daily_views) || 0,
      daily_engagement: (Number(item.daily_likes) || 0) + (Number(item.daily_comments) || 0)
    })) || [];
  }

  static getDateRangeParams(dateRange?: { from?: Date; to?: Date }) {
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.to || new Date();
    
    return {
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0]
    };
  }
}