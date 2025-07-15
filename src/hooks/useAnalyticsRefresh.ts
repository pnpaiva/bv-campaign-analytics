import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  creator_name: string;
}

export const useAnalyticsRefresh = (
  fetchVideoAnalytics: (creatorIds: string[], dateRange?: any, platform?: string, forceRefresh?: boolean) => Promise<void>,
  refreshVideoAnalytics: (creatorIds: string[]) => Promise<void>
) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefreshAnalytics = useCallback(async (
    activeCreators: Creator[],
    dateRange?: any,
    selectedPlatform?: string
  ) => {
    if (activeCreators.length === 0) {
      toast({
        title: "No Creators Selected",
        description: "Please select creators to refresh their analytics data",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Refreshing video analytics for active creators:', activeCreators.map(c => ({ id: c.id, name: c.creator_name })));
    
    setRefreshing(true);
    try {
      await refreshVideoAnalytics(activeCreators.map(c => c.id));
      
      // Wait a moment then refetch the data
      setTimeout(() => {
        console.log('Refetching analytics data after refresh...');
        fetchVideoAnalytics(
          activeCreators.map(c => c.id),
          dateRange,
          selectedPlatform === "all" ? undefined : selectedPlatform,
          true // Force refresh
        );
      }, 3000);
    } catch (error) {
      console.error('Error refreshing video analytics:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 4000);
    }
  }, [fetchVideoAnalytics, refreshVideoAnalytics, toast]);

  const handleManualRefresh = useCallback((
    activeCreators: Creator[],
    dateRange?: any,
    selectedPlatform?: string
  ) => {
    if (activeCreators.length > 0) {
      console.log('Manual refresh for active creators:', activeCreators.map(c => ({ id: c.id, name: c.creator_name })));
      fetchVideoAnalytics(
        activeCreators.map(c => c.id),
        dateRange,
        selectedPlatform === "all" ? undefined : selectedPlatform
      );
    }
  }, [fetchVideoAnalytics]);

  return {
    refreshing,
    handleRefreshAnalytics,
    handleManualRefresh,
  };
};