import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { campaignAnalyticsService, CampaignAnalytics } from '../services/campaign-analytics';
import { toast } from 'sonner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UseCampaignAnalyticsResult {
  analytics: CampaignAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useCampaignAnalytics(campaignId: string | null): UseCampaignAnalyticsResult {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!campaignId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching analytics for campaign:', campaignId);
      
      // First check if campaign exists and has content URLs
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, content_urls')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Check if campaign has content URLs
      if (!campaign.content_urls || campaign.content_urls.length === 0) {
        setError('No content URLs found for this campaign. Please add content URLs and try again.');
        setIsLoading(false);
        return;
      }

      // Fetch analytics
      const analyticsData = await campaignAnalyticsService.fetchCampaignAnalytics(campaignId);
      
      if (!analyticsData) {
        throw new Error('Failed to fetch analytics data');
      }

      setAnalytics(analyticsData);
      
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId, fetchAnalytics]);

  const refetch = async () => {
    await fetchAnalytics();
  };

  const clearError = () => {
    setError(null);
  };

  return {
    analytics,
    isLoading,
    error,
    refetch,
    clearError,
  };
}

// Hook to handle analytics modal state
export function useAnalyticsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { analytics, isLoading, error, refetch, clearError } = useCampaignAnalytics(selectedCampaignId);

  const openAnalytics = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsOpen(true);
  };

  const closeAnalytics = () => {
    setIsOpen(false);
    setSelectedCampaignId(null);
    clearError();
  };

  return {
    isOpen,
    selectedCampaignId,
    analytics,
    isLoading,
    error,
    openAnalytics,
    closeAnalytics,
    refetch,
  };
}