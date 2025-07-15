import { useMemo } from 'react';
import { VideoAnalyticsData, CreatorAnalyticsData } from '@/types/analytics';

export const useRosterMetrics = (
  analyticsData: VideoAnalyticsData[],
  creatorAnalyticsData: CreatorAnalyticsData[]
) => {
  return useMemo(() => {
    if (analyticsData.length === 0) {
      return {
        totalViews: 0,
        totalEngagement: 0,
        totalSubscribers: 0,
        averageEngagementRate: 0,
      };
    }

    // Calculate totals from daily values
    const totalViews = analyticsData.reduce((sum, item) => sum + (item.daily_views || 0), 0);
    const totalEngagement = analyticsData.reduce((sum, item) => sum + (item.daily_engagement || 0), 0);
    const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    // Get current total subscribers from latest data
    const latestDate = analyticsData[analyticsData.length - 1]?.date;
    const totalSubscribers = latestDate ? 
      creatorAnalyticsData
        .filter(item => item.date === latestDate)
        .reduce((sum, item) => sum + item.subscribers, 0) : 0;

    return {
      totalViews,
      totalEngagement,
      totalSubscribers,
      averageEngagementRate
    };
  }, [analyticsData, creatorAnalyticsData]);
};

export const useCreatorMetrics = (creatorAnalyticsData: CreatorAnalyticsData[]) => {
  return useMemo(() => {
    return (creatorId: string) => {
      const creatorData = creatorAnalyticsData.filter(d => d.creator_id === creatorId);
      if (creatorData.length === 0) return null;

      const latestData = creatorData[creatorData.length - 1];
      const totalViews = creatorData.reduce((sum, item) => sum + (item.daily_views || 0), 0);
      const totalEngagement = creatorData.reduce((sum, item) => sum + (item.daily_engagement || 0), 0);
      
      return {
        views: totalViews,
        engagement: totalEngagement,
        subscribers: latestData?.subscribers || 0,
        engagementRate: totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : "0.00"
      };
    };
  }, [creatorAnalyticsData]);
};