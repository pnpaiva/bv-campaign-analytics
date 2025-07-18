// Quick debugging script for campaign analytics
// Run this in the browser console to test functionality

import { campaignAnalyticsService } from '../services/campaign-analytics';
import { analyticsService } from '../lib/analytics-service';
import { edgeFunctionDebugger } from './debug-edge-functions';

// Quick test function
export async function quickTest() {
  console.log('🚀 Starting quick test...');
  
  // Test Edge Functions
  console.log('\n1️⃣ Testing Edge Functions...');
  await edgeFunctionDebugger.testAllAnalyticsFunctions();
  
  // Test analytics service
  console.log('\n2️⃣ Testing Analytics Service...');
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const analytics = await analyticsService.fetchAnalyticsByUrl(testUrl);
  console.log('Analytics result:', analytics);
  
  // Test campaign analytics (if you have a campaign ID)
  console.log('\n3️⃣ Testing Campaign Analytics...');
  console.log('To test campaign analytics, run:');
  console.log('campaignAnalyticsService.fetchCampaignAnalytics("your-campaign-id")');
  
  console.log('\n✅ Quick test complete!');
}

// Auto-inject into window for easy access
if (typeof window !== 'undefined') {
  (window as any).quickTest = quickTest;
  (window as any).campaignAnalyticsService = campaignAnalyticsService;
  (window as any).analyticsService = analyticsService;
  
  console.log('🎆 Debug tools loaded!');
  console.log('Available commands:');
  console.log('- quickTest() - Run a quick test of all systems');
  console.log('- debugEdgeFunctions() - Test Edge Functions');
  console.log('- campaignAnalyticsService - Access campaign analytics');
  console.log('- analyticsService - Access URL analytics');
}