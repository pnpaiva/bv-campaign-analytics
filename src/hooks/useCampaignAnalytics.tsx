import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchYouTubeData, isYouTubeUrl } from '@/services/youtubeApi';
import { fetchInstagramData, isInstagramUrl } from '@/services/instagramApi';
import { fetchTikTokData, isTikTokUrl } from '@/services/tiktokApi';

export const useCampaignAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshCampaignAnalytics = async (campaignId: string) => {
    setLoading(true);
    
    console.log('=== Starting campaign analytics refresh ===');
    console.log('Campaign ID:', campaignId);
    
    try {
      // Get campaign and its analytics data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          id,
          brand_name,
          analytics_data (
            id,
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
        throw new Error('No analytics data found for this campaign. Please add content URLs and try again.');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const analytics of campaignData.analytics_data) {
        if (!analytics.content_url) continue;

        try {
          console.log(`Refreshing analytics for URL: ${analytics.content_url}`);
          let analyticsData = null;

          // Fetch data based on platform
          if (analytics.platform === 'youtube' && isYouTubeUrl(analytics.content_url)) {
            analyticsData = await fetchYouTubeData(analytics.content_url);
          } else if (analytics.platform === 'instagram' && isInstagramUrl(analytics.content_url)) {
            analyticsData = await fetchInstagramData(analytics.content_url);
          } else if (analytics.platform === 'tiktok' && isTikTokUrl(analytics.content_url)) {
            analyticsData = await fetchTikTokData(analytics.content_url);
          } else {
            console.warn(`Unknown platform or invalid URL: ${analytics.platform} - ${analytics.content_url}`);
            continue;
          }

          if (analyticsData) {
            // Update the analytics data in Supabase
            const { error: updateError } = await supabase
              .from('analytics_data')
              .update({
                views: analyticsData.viewCount || 0,
                likes: analyticsData.likeCount || 0,
                comments: analyticsData.commentCount || 0,
                engagement_rate: analyticsData.engagementRate || 0,
                shares: (analyticsData as any).shareCount || 0,
                last_fetched: new Date().toISOString(),
                fetch_status: 'success',
                title: (analyticsData as any).title || (analyticsData as any).caption || null,
              })
              .eq('id', analytics.id);

            if (updateError) {
              console.error('Error updating analytics:', updateError);
              errors.push(`Failed to update ${analytics.content_url}: ${updateError.message}`);
            } else {
              console.log('Analytics updated for URL:', analytics.content_url);
              successCount++;
            }
          } else {
            errors.push(`Failed to fetch data for ${analytics.content_url}`);
          }
        } catch (error) {
          console.error(`Failed to refresh URL ${analytics.content_url}:`, error);
          errors.push(`URL ${analytics.content_url}: ${error.message}`);
          
          // Update fetch status to failed
          await supabase
            .from('analytics_data')
            .update({
              fetch_status: 'failed',
              last_fetched: new Date().toISOString(),
            })
            .eq('id', analytics.id);
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
        throw new Error('No valid URLs found to refresh');
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