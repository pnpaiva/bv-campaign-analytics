
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCampaignAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshCampaignAnalytics = async (campaignId: string) => {
    setLoading(true);
    
    console.log('=== Starting campaign analytics refresh ===');
    console.log('Campaign ID:', campaignId);
    
    try {
      // Get campaign and its analytics data to find YouTube URLs
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          id,
          brand_name,
          analytics_data (
            content_url,
            platform
          )
        `)
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
        throw new Error(`Failed to fetch campaign: ${campaignError.message}`);
      }

      console.log('Campaign data:', campaignData);

      if (!campaignData.analytics_data || campaignData.analytics_data.length === 0) {
        throw new Error('No analytics data found for this campaign. Please add YouTube URLs first.');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const analytics of campaignData.analytics_data) {
        if (analytics.platform === 'youtube' && analytics.content_url) {
          try {
            console.log(`Refreshing analytics for URL: ${analytics.content_url}`);
            
            const { data, error } = await supabase.functions.invoke('direct-youtube-analytics', {
              body: { 
                campaign_id: campaignId,
                video_url: analytics.content_url
              }
            });

            console.log('Function response:', { data, error });

            if (error) {
              console.error('Edge function error:', error);
              errors.push(`Function error: ${error.message}`);
              continue;
            }

            if (!data || !data.success) {
              const errorMsg = data?.error || 'Unknown error occurred';
              console.error('Function returned error:', errorMsg);
              errors.push(`API error: ${errorMsg}`);
              continue;
            }

            console.log('Analytics updated for URL:', analytics.content_url);
            successCount++;
          } catch (error) {
            console.error(`Failed to refresh URL ${analytics.content_url}:`, error);
            errors.push(`URL ${analytics.content_url}: ${error.message}`);
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: "Analytics Updated!",
          description: `Successfully updated ${successCount} video(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        });
      } else if (errors.length > 0) {
        throw new Error(`All updates failed: ${errors.join(', ')}`);
      } else {
        throw new Error('No YouTube URLs found to refresh');
      }

    } catch (error) {
      console.error('Campaign analytics error:', error);
      
      toast({
        title: "Analytics Error",
        description: error.message || 'Failed to refresh campaign analytics',
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshAllCampaigns = async (campaignIds: string[]) => {
    setLoading(true);
    
    console.log('=== Starting batch campaign refresh ===');
    console.log('Campaign IDs:', campaignIds);
    
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const campaignId of campaignIds) {
        try {
          await refreshCampaignAnalytics(campaignId);
          successCount++;
        } catch (error) {
          console.error(`Failed to refresh campaign ${campaignId}:`, error);
          errors.push(`Campaign ${campaignId}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Batch Update Complete",
          description: `Successfully updated ${successCount} campaigns${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        });
      }

      if (errors.length > 0 && successCount === 0) {
        throw new Error(`All campaign updates failed: ${errors.join(', ')}`);
      }

      return { successCount, errors };
    } catch (error) {
      console.error('Batch campaign refresh error:', error);
      
      toast({
        title: "Batch Update Error",
        description: error.message || 'Failed to refresh campaigns',
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    refreshCampaignAnalytics,
    refreshAllCampaigns,
  };
};
