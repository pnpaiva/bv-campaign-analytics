import { createClient } from '@supabase/supabase-js';
import { analyticsService } from '../lib/analytics-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  totalViews: number;
  totalEngagement: number;
  averageRate: number;
  contentAnalytics: Array<{
    url: string;
    platform: string;
    views: number;
    engagement: number;
    rate: number;
    fetchedAt?: string;
  }>;
  lastUpdated: string;
}

export const campaignAnalyticsService = {
  // Fetch analytics for a specific campaign
  async fetchCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    try {
      console.log('Fetching campaign data for ID:', campaignId);
      
      // First, get the campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        console.error('Campaign not found:', campaignError);
        return null;
      }

      console.log('Campaign data:', campaign);

      // Extract content URLs from the campaign
      const contentUrls = campaign.content_urls || [];
      
      if (!Array.isArray(contentUrls) || contentUrls.length === 0) {
        console.warn('No content URLs found for campaign');
        return {
          campaignId: campaign.id,
          campaignName: campaign.name || 'Unnamed Campaign',
          totalViews: 0,
          totalEngagement: 0,
          averageRate: 0,
          contentAnalytics: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      // Check if analytics are already stored and recent
      const hasRecentAnalytics = contentUrls.every(item => 
        item.analytics && 
        item.analytics.fetchedAt && 
        new Date(item.analytics.fetchedAt) > new Date(Date.now() - 3600000) // 1 hour
      );

      let analyticsData = contentUrls;

      // If analytics are missing or old, fetch fresh data
      if (!hasRecentAnalytics) {
        console.log('Fetching fresh analytics for URLs:', contentUrls.map(u => u.url));
        
        const analyticsPromises = contentUrls.map(async (item) => {
          const analytics = await analyticsService.fetchAnalyticsByUrl(item.url);
          return {
            ...item,
            platform: analytics.platform,
            analytics: {
              views: analytics.views,
              engagement: analytics.engagement,
              rate: analytics.rate,
              fetchedAt: new Date().toISOString(),
            },
          };
        });

        analyticsData = await Promise.all(analyticsPromises);

        // Update campaign with fresh analytics
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ 
            content_urls: analyticsData,
            analytics_updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);

        if (updateError) {
          console.error('Failed to update campaign analytics:', updateError);
        }
      }

      // Calculate totals
      const totalViews = analyticsData.reduce((sum, item) => 
        sum + (item.analytics?.views || 0), 0
      );
      const totalEngagement = analyticsData.reduce((sum, item) => 
        sum + (item.analytics?.engagement || 0), 0
      );
      const averageRate = analyticsData.length > 0
        ? analyticsData.reduce((sum, item) => 
            sum + (item.analytics?.rate || 0), 0
          ) / analyticsData.length
        : 0;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name || 'Unnamed Campaign',
        totalViews,
        totalEngagement,
        averageRate,
        contentAnalytics: analyticsData.map(item => ({
          url: item.url,
          platform: item.platform || 'unknown',
          views: item.analytics?.views || 0,
          engagement: item.analytics?.engagement || 0,
          rate: item.analytics?.rate || 0,
          fetchedAt: item.analytics?.fetchedAt,
        })),
        lastUpdated: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  },

  // Refresh analytics for all URLs in a campaign
  async refreshCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    try {
      // Get campaign data
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error || !campaign) {
        throw new Error('Campaign not found');
      }

      const contentUrls = campaign.content_urls || [];
      
      // Force refresh all analytics
      const analyticsPromises = contentUrls.map(async (item) => {
        const analytics = await analyticsService.fetchAnalyticsByUrl(item.url);
        return {
          ...item,
          platform: analytics.platform,
          analytics: {
            views: analytics.views,
            engagement: analytics.engagement,
            rate: analytics.rate,
            fetchedAt: new Date().toISOString(),
          },
        };
      });

      const updatedAnalytics = await Promise.all(analyticsPromises);

      // Update campaign
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          content_urls: updatedAnalytics,
          analytics_updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (updateError) {
        throw updateError;
      }

      // Return formatted analytics
      return this.fetchCampaignAnalytics(campaignId);

    } catch (error) {
      console.error('Error refreshing campaign analytics:', error);
      return null;
    }
  },

  // Get analytics for multiple campaigns
  async fetchMultipleCampaignAnalytics(campaignIds: string[]): Promise<CampaignAnalytics[]> {
    const promises = campaignIds.map(id => this.fetchCampaignAnalytics(id));
    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as CampaignAnalytics[];
  },
};

export type { CampaignAnalytics };