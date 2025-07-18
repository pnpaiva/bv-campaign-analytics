import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AnalyticsData {
  views: number;
  engagement: number;
  rate: number;
  error?: string;
}

interface EdgeFunctionError {
  message: string;
  context?: {
    status?: number;
    response?: Response;
  };
}

// Helper to safely invoke Edge Functions with proper error handling
async function invokeAnalyticsFunction(
  functionName: string,
  url: string
): Promise<AnalyticsData> {
  try {
    console.log(`Invoking ${functionName} for URL:`, url);

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { url },
    });

    // Handle Edge Function errors
    if (error) {
      const edgeError = error as EdgeFunctionError;
      console.error(`${functionName} error:`, edgeError);

      // Log specific error details
      if (edgeError.context?.status) {
        console.error(`Status: ${edgeError.context.status}`);
      }

      // Try to get error body if available
      if (edgeError.context?.response) {
        try {
          const errorBody = await edgeError.context.response.text();
          console.error('Error body:', errorBody);
        } catch (e) {
          console.error('Could not read error body');
        }
      }

      // Return default values with error message
      return {
        views: 0,
        engagement: 0,
        rate: 0,
        error: edgeError.message || 'Analytics unavailable',
      };
    }

    // Validate response data
    if (!data || typeof data !== 'object') {
      console.warn(`Invalid response from ${functionName}:`, data);
      return {
        views: 0,
        engagement: 0,
        rate: 0,
        error: 'Invalid response format',
      };
    }

    // Extract analytics data with defaults
    return {
      views: parseInt(data.views) || 0,
      engagement: parseInt(data.engagement) || 0,
      rate: parseFloat(data.rate) || 0,
    };
  } catch (error) {
    console.error(`Exception in ${functionName}:`, error);
    return {
      views: 0,
      engagement: 0,
      rate: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Platform detection helper
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('instagram.com')) {
    return 'instagram';
  }
  if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  }
  return 'unknown';
}

// Analytics service with all platforms
export const analyticsService = {
  // Fetch YouTube analytics
  async fetchYouTubeAnalytics(url: string): Promise<AnalyticsData> {
    return invokeAnalyticsFunction('fetch-youtube-analytics', url);
  },

  // Fetch Instagram analytics
  async fetchInstagramAnalytics(url: string): Promise<AnalyticsData> {
    return invokeAnalyticsFunction('fetch-instagram-analytics', url);
  },

  // Fetch TikTok analytics
  async fetchTikTokAnalytics(url: string): Promise<AnalyticsData> {
    return invokeAnalyticsFunction('fetch-tiktok-analytics', url);
  },

  // Fetch analytics based on URL platform
  async fetchAnalyticsByUrl(url: string): Promise<AnalyticsData & { platform: string }> {
    const platform = detectPlatform(url);
    let analytics: AnalyticsData;

    switch (platform) {
      case 'youtube':
        analytics = await this.fetchYouTubeAnalytics(url);
        break;
      case 'instagram':
        analytics = await this.fetchInstagramAnalytics(url);
        break;
      case 'tiktok':
        analytics = await this.fetchTikTokAnalytics(url);
        break;
      default:
        analytics = {
          views: 0,
          engagement: 0,
          rate: 0,
          error: `Unknown platform for URL: ${url}`,
        };
    }

    return { ...analytics, platform };
  },

  // Batch fetch for multiple URLs
  async fetchBatchAnalytics(
    urls: string[]
  ): Promise<Array<AnalyticsData & { url: string; platform: string }>> {
    const promises = urls.map(async (url) => {
      const result = await this.fetchAnalyticsByUrl(url);
      return { ...result, url };
    });

    return Promise.all(promises);
  },

  // Test all Edge Functions
  async testAllFunctions(): Promise<void> {
    console.log('🧪 Testing all Edge Functions...');
    
    const testUrls = {
      youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      instagram: 'https://www.instagram.com/p/C1234567890/',
      tiktok: 'https://www.tiktok.com/@test/video/1234567890',
    };

    for (const [platform, url] of Object.entries(testUrls)) {
      console.log(`\nTesting ${platform}...`);
      const result = await this.fetchAnalyticsByUrl(url);
      console.log(`Result:`, result);
    }
  },
};

// Export helper functions
export { detectPlatform };
export type { AnalyticsData };