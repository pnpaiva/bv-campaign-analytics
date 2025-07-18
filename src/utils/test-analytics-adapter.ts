// Test function for the campaign analytics adapter
import { campaignAnalyticsAdapter } from '../services/campaign-analytics-adapter';

// Quick test to verify the adapter works with your data structure
export async function testAnalyticsAdapter(campaignId?: string) {
  console.log('🧪 Testing Campaign Analytics Adapter...');
  
  // If no campaign ID provided, use one from the list
  if (!campaignId) {
    const { data: campaigns } = await window.supabase
      .from('campaigns')
      .select('id, name')
      .limit(1);
      
    if (!campaigns || campaigns.length === 0) {
      console.error('No campaigns found!');
      return;
    }
    
    campaignId = campaigns[0].id;
    console.log(`Using campaign: ${campaigns[0].name} (${campaignId})`);
  }
  
  try {
    // Test fetching analytics
    console.log('\nFetching analytics...');
    const analytics = await campaignAnalyticsAdapter.fetchCampaignAnalytics(campaignId);
    
    if (!analytics) {
      console.error('Failed to fetch analytics');
      return;
    }
    
    console.log('✅ Analytics fetched successfully!');
    console.log('Campaign Name:', analytics.campaignName);
    console.log('Total Views:', analytics.totalViews);
    console.log('Total Engagement:', analytics.totalEngagement);
    console.log('Average Rate:', analytics.averageRate + '%');
    console.log('Content URLs found:', analytics.contentAnalytics.length);
    
    // Show details for each URL
    analytics.contentAnalytics.forEach((content, index) => {
      console.log(`\n🔗 URL ${index + 1}: ${content.platform}`);
      console.log(`   Views: ${content.views}`);
      console.log(`   Engagement: ${content.engagement}`);
      console.log(`   Rate: ${content.rate}%`);
      console.log(`   URL: ${content.url}`);
    });
    
    return analytics;
  } catch (error) {
    console.error('Error testing adapter:', error);
  }
}

// Auto-inject for browser console
if (typeof window !== 'undefined') {
  (window as any).testAnalyticsAdapter = testAnalyticsAdapter;
  (window as any).campaignAnalyticsAdapter = campaignAnalyticsAdapter;
  
  console.log('🎆 Analytics Adapter Test Ready!');
  console.log('Run: testAnalyticsAdapter() or testAnalyticsAdapter("campaign-id")');
}