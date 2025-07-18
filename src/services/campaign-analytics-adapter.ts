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

// Helper to clean and validate URLs
function cleanUrl(url: string): string {
  if (!url) return '';
  
  // Trim whitespace
  let cleaned = url.trim();
  
  // Remove any spaces within the URL
  cleaned = cleaned.replace(/\s+/g, '');
  
  // Ensure proper protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  
  return cleaned;
}

// Helper to extract URLs from different content_urls formats
function extractUrlsFromCampaign(campaign: any): string[] {
  const urls: string[] = [];
  
  // Handle different possible structures
  if (campaign.content_urls) {
    // If it's an array of objects with url property
    if (Array.isArray(campaign.content_urls)) {
      campaign.content_urls.forEach((item: any) => {
        if (typeof item === 'string') {
          urls.push(item);
        } else if (item.url) {
          urls.push(item.url);
        } else if (item.youtube) {
          urls.push(item.youtube);
        } else if (item.instagram) {
          urls.push(item.instagram);
        } else if (item.tiktok) {
          urls.push(item.tiktok);
        }
      });
    } 
    // If it's an object with platform properties
    else if (typeof campaign.content_urls === 'object') {
      if (campaign.content_urls.youtube) urls.push(campaign.content_urls.youtube);
      if (campaign.content_urls.instagram) urls.push(campaign.content_urls.instagram);
      if (campaign.content_urls.tiktok) urls.push(campaign.content_urls.tiktok);
    }
  }
  
  // Also check for direct platform fields
  if (campaign.youtube_url) urls.push(campaign.youtube_url);
  if (campaign.instagram_url) urls.push(campaign.instagram_url);
  if (campaign.tiktok_url) urls.push(campaign.tiktok_url);
  
  // Clean all URLs and filter out empty strings
  return [...new Set(urls.map(cleanUrl).filter(url => url && url.trim() !== ''))];
}

export const campaignAnalyticsAdapter = {
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

      // Extract URLs from the campaign using our flexible extractor
      const urls = extractUrlsFromCampaign(campaign);
      
      console.log('Extracted and cleaned URLs:', urls);
      
      if (urls.length === 0) {
        console.warn('No content URLs found for campaign');
        return {
          campaignId: campaign.id,
          campaignName: campaign.name || campaign.campaign_name || 'Unnamed Campaign',
          totalViews: 0,
          totalEngagement: 0,
          averageRate: 0,
          contentAnalytics: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      // Fetch analytics for each URL
      console.log('Fetching analytics for URLs:', urls);
      
      const analyticsPromises = urls.map(async (url) => {
        try {
          const analytics = await analyticsService.fetchAnalyticsByUrl(url);
          return {
            url,
            platform: analytics.platform,
            views: analytics.views || 0,
            engagement: analytics.engagement || 0,
            rate: analytics.rate || 0,
            fetchedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching analytics for ${url}:`, error);
          return {
            url,
            platform: 'unknown',
            views: 0,
            engagement: 0,
            rate: 0,
            fetchedAt: new Date().toISOString(),
          };
        }
      });

      const analyticsData = await Promise.all(analyticsPromises);

      // Calculate totals
      const totalViews = analyticsData.reduce((sum, item) => sum + item.views, 0);
      const totalEngagement = analyticsData.reduce((sum, item) => sum + item.engagement, 0);
      const averageRate = analyticsData.length > 0
        ? analyticsData.reduce((sum, item) => sum + item.rate, 0) / analyticsData.length
        : 0;

      // Try to update the campaign with analytics data
      try {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ 
            analytics_data: analyticsData,
            analytics_updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);

        if (updateError) {
          console.warn('Could not update campaign analytics:', updateError);
        }
      } catch (e) {
        console.warn('Failed to save analytics to database:', e);
      }

      return {
        campaignId: campaign.id,
        campaignName: campaign.name || campaign.campaign_name || 'Unnamed Campaign',
        totalViews,
        totalEngagement,
        averageRate,
        contentAnalytics: analyticsData,
        lastUpdated: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  },

  // Refresh analytics for all URLs in a campaign
  async refreshCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    // Simply re-fetch with fresh data
    return this.fetchCampaignAnalytics(campaignId);
  },

  // Get analytics for multiple campaigns
  async fetchMultipleCampaignAnalytics(campaignIds: string[]): Promise<CampaignAnalytics[]> {
    const promises = campaignIds.map(id => this.fetchCampaignAnalytics(id));
    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as CampaignAnalytics[];
  },
};

export type { CampaignAnalytics };