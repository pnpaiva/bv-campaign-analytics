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

// Example usage:
// testInstagramAnalytics('https://www.instagram.com/p/ABC123/');
// testTikTokAnalytics('https://www.tiktok.com/@username/video/123456');
