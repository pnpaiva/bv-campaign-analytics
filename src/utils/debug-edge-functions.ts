import { supabase } from '@/integrations/supabase/client';

export async function testInstagramAnalytics(url: string) {
  try {
    console.log('Testing Instagram analytics for:', url);
    
    const { data, error } = await supabase.functions.invoke('instagram-analytics', {
      body: { url }
    });

    if (error) {
      console.error('Instagram analytics error:', error);
      return null;
    }

    console.log('Instagram analytics data:', data);
    return data;
  } catch (error) {
    console.error('Instagram analytics exception:', error);
    return null;
  }
}

export async function testTikTokAnalytics(url: string) {
  try {
    console.log('Testing TikTok analytics for:', url);
    
    const { data, error } = await supabase.functions.invoke('tiktok-analytics', {
      body: { url }
    });

    if (error) {
      console.error('TikTok analytics error:', error);
      return null;
    }

    console.log('TikTok analytics data:', data);
    return data;
  } catch (error) {
    console.error('TikTok analytics exception:', error);
    return null;
  }
}

// Debug functions collection
export const edgeFunctionDebugger = {
  testInstagramAnalytics,
  testTikTokAnalytics,
  async testAllAnalyticsFunctions() {
    console.log('🔍 Testing all analytics functions...');
    
    // Test Instagram
    console.log('\n📸 Testing Instagram Analytics...');
    await testInstagramAnalytics('https://www.instagram.com/p/test123/');
    
    // Test TikTok  
    console.log('\n🎵 Testing TikTok Analytics...');
    await testTikTokAnalytics('https://www.tiktok.com/@username/video/123456');
    
    console.log('\n✅ All analytics functions tested!');
  }
};

// Example usage:
// testInstagramAnalytics('https://www.instagram.com/p/ABC123/');
// testTikTokAnalytics('https://www.tiktok.com/@username/video/123456');
