export interface VideoAnalyticsData {
  date: string;
  views: number;
  engagement: number;
  subscribers: number;
  daily_views?: number;
  daily_engagement?: number;
  videosPosted?: number;
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

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface RosterAnalyticsParams {
  p_creator_ids: string[];
  p_start_date: string;
  p_end_date: string;
}