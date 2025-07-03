
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCampaignAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshCampaignAnalytics = async (campaignId: string) => {
    setLoading(true);
    console.log('Refreshing analytics for campaign:', campaignId);
    
    try {
      // Get all video URLs for this campaign
      const { data: analyticsData, error: fetchError } = await supabase
        .from('analytics_data')
        .select('content_url, platform')
        .eq('campaign_id', campaignId);

      if (fetchError) throw fetchError;

      if (!analyticsData || analyticsData.length === 0) {
        toast({
          title: "No Content",
          description: "No video URLs found for this campaign. Add video URLs first.",
          variant: "destructive",
        });
        return;
      }

      // Refresh analytics for each video URL
      for (const content of analyticsData) {
        if (content.platform === 'youtube' && content.content_url) {
          console.log('Refreshing YouTube video:', content.content_url);
          
          const { error: refreshError } = await supabase.functions.invoke('fetch-youtube-analytics', {
            body: { 
              campaign_id: campaignId,
              video_url: content.content_url
            }
          });

          if (refreshError) {
            console.error(`Error refreshing ${content.content_url}:`, refreshError);
          } else {
            console.log(`Successfully refreshed ${content.content_url}`);
          }
        }
      }

      toast({
        title: "Success",
        description: `Refreshed analytics for ${analyticsData.length} video(s)`,
      });

    } catch (error) {
      console.error('Error refreshing campaign analytics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh campaign analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAllCampaigns = async (campaignIds: string[]) => {
    setLoading(true);
    
    try {
      for (const campaignId of campaignIds) {
        await refreshCampaignAnalytics(campaignId);
      }
      
      toast({
        title: "Success",
        description: `Refreshed analytics for ${campaignIds.length} campaigns`,
      });
    } catch (error) {
      console.error('Error refreshing all campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to refresh all campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    refreshCampaignAnalytics,
    refreshAllCampaigns
  };
};
