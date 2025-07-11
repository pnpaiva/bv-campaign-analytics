
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRosterAnalytics } from './useRosterAnalytics';
import { AnalyticsService } from '@/services/analyticsService';
import { AnalyticsUtils } from '@/utils/analyticsUtils';
import { VideoAnalyticsData, CreatorAnalyticsData, DateRange } from '@/types/analytics';

export const useVideoAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<VideoAnalyticsData[]>([]);
  const [creatorAnalyticsData, setCreatorAnalyticsData] = useState<CreatorAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshAllCreators } = useRosterAnalytics();

  const fetchVideoAnalytics = useCallback(async (
    creatorIds: string[],
    dateRange?: DateRange,
    platform?: string,
    forceRefresh: boolean = false
  ) => {
    console.log('Fetching video analytics for creators:', creatorIds);
    
    if (!creatorIds || creatorIds.length === 0) {
      console.log('No creator IDs provided');
      setAnalyticsData([]);
      setCreatorAnalyticsData([]);
      return;
    }

    setLoading(true);
    
    try {
      // Get date range parameters
      const dateParams = AnalyticsUtils.getDateRangeParams(dateRange);
      
      // Fetch aggregated analytics using the service
      const aggregatedData = await AnalyticsService.fetchAggregatedAnalytics({
        p_creator_ids: creatorIds,
        ...dateParams
      });

      // Fetch individual creator data
      const individualData = await AnalyticsService.fetchIndividualAnalytics(creatorIds, dateRange);

      console.log('Aggregated analytics data:', aggregatedData);
      console.log('Individual analytics data:', individualData);

      // Process the data using utilities
      const processedAnalytics = AnalyticsUtils.processAggregatedData(aggregatedData);
      const creatorData = AnalyticsUtils.processIndividualData(individualData);

      console.log('Processed analytics data:', processedAnalytics);
      console.log('Processed creator data:', creatorData);
      
      // Clear existing data first to ensure fresh state
      setAnalyticsData([]);
      setCreatorAnalyticsData([]);
      
      // Set new data with a small delay to ensure state update
      setTimeout(() => {
        setAnalyticsData(processedAnalytics);
        setCreatorAnalyticsData(creatorData);
      }, 100);
      
    } catch (error) {
      console.error('Error fetching video analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch video analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshVideoAnalytics = useCallback(async (creatorIds: string[]) => {
    console.log('Refreshing video analytics for creators:', creatorIds);
    
    try {
      // Get creators data using the service
      const creators = await AnalyticsService.fetchCreatorsForRefresh(creatorIds);

      console.log('Creators data for video refresh:', creators);

      if (!creators || creators.length === 0) {
        throw new Error('No creators found');
      }

      // Use the roster analytics refresh function which calls the YouTube API
      await refreshAllCreators(creators);
      
      toast({
        title: "Video Analytics Refresh Complete",
        description: `Successfully refreshed data for ${creators.length} creator${creators.length !== 1 ? 's' : ''}`,
      });

    } catch (error) {
      console.error('Error refreshing video analytics:', error);
      toast({
        title: "Refresh Error",
        description: error.message || 'Failed to refresh video analytics',
        variant: "destructive",
      });
      throw error;
    }
  }, [refreshAllCreators, toast]);

  return {
    analyticsData,
    creatorAnalyticsData,
    loading,
    fetchVideoAnalytics,
    refreshVideoAnalytics,
  };
};
