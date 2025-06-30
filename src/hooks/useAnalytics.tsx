
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerAnalytics = async (campaignId: string, platforms?: string[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-analytics-job', {
        body: { 
          campaign_id: campaignId,
          platforms: platforms || ['youtube']
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Analytics job started for ${data.jobs_created} platform(s)`,
      });

      return data;
    } catch (error) {
      console.error('Error triggering analytics:', error);
      toast({
        title: "Error",
        description: "Failed to start analytics job",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('fetched_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
      return [];
    }
  };

  const getAnalyticsJobs = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('analytics_jobs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching analytics jobs:', error);
      return [];
    }
  };

  return {
    loading,
    triggerAnalytics,
    fetchAnalyticsData,
    getAnalyticsJobs,
  };
};
