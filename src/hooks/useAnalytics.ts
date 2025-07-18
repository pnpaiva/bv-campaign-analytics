import { useState, useCallback } from 'react';
import { analyticsService, AnalyticsData } from '../lib/analytics-service';
import { toast } from 'sonner';

interface UseAnalyticsResult {
  fetchAnalytics: (url: string) => Promise<AnalyticsData>;
  fetchBatchAnalytics: (urls: string[]) => Promise<Array<AnalyticsData & { url: string; platform: string }>>;
  isLoading: boolean;
  error: string | null;
}

export function useAnalytics(): UseAnalyticsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (url: string): Promise<AnalyticsData> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await analyticsService.fetchAnalyticsByUrl(url);
      
      if (result.error) {
        console.warn(`Analytics warning for ${url}:`, result.error);
        toast.warning(`Analytics temporarily unavailable for this URL. Using default values.`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics fetch error:', err);
      
      // Return safe defaults
      return {
        views: 0,
        engagement: 0,
        rate: 0,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBatchAnalytics = useCallback(async (
    urls: string[]
  ): Promise<Array<AnalyticsData & { url: string; platform: string }>> => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await analyticsService.fetchBatchAnalytics(urls);
      
      // Count errors
      const errorCount = results.filter(r => r.error).length;
      if (errorCount > 0) {
        toast.warning(`Analytics unavailable for ${errorCount} URL(s). Using default values.`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch batch analytics';
      setError(errorMessage);
      console.error('Batch analytics fetch error:', err);
      
      // Return safe defaults for all URLs
      return urls.map(url => ({
        url,
        platform: 'unknown',
        views: 0,
        engagement: 0,
        rate: 0,
        error: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchAnalytics,
    fetchBatchAnalytics,
    isLoading,
    error,
  };
}