import { fetchInstagramData, isInstagramUrl } from './instagramApi';
import { fetchYouTubeData, isYouTubeUrl } from './youtubeApi';
import { toast } from 'sonner';

export interface ContentAnalytics {
  url: string;
  platform: 'youtube' | 'instagram';
  viewCount: number;
  engagementCount: number;
  engagementRate: number;
  title?: string;
  fetchedAt: string;
  error?: string;
}

export interface CampaignMetrics {
  totalViews: number;
  totalEngagement: number;
  averageEngagementRate: number;
  platformBreakdown: {
    youtube: { count: number; views: number; engagement: number };
    instagram: { count: number; views: number; engagement: number };
  };
}

export async function fetchContentAnalytics(urls: string[]): Promise<ContentAnalytics[]> {
  const analytics: ContentAnalytics[] = [];
  const fetchPromises: Promise<void>[] = [];

  for (const url of urls) {
    const fetchPromise = (async () => {
      try {
        if (isYouTubeUrl(url)) {
          const data = await fetchYouTubeData(url);
          if (data) {
            analytics.push({
              url,
              platform: 'youtube',
              viewCount: data.viewCount,
              engagementCount: data.likeCount + data.commentCount,
              engagementRate: data.engagementRate,
              title: data.title,
              fetchedAt: new Date().toISOString(),
            });
          } else {
            analytics.push({
              url,
              platform: 'youtube',
              viewCount: 0,
              engagementCount: 0,
              engagementRate: 0,
              fetchedAt: new Date().toISOString(),
              error: 'Failed to fetch data',
            });
          }
        } else if (isInstagramUrl(url)) {
          const data = await fetchInstagramData(url);
          if (data) {
            analytics.push({
              url,
              platform: 'instagram',
              viewCount: data.viewCount,
              engagementCount: data.likeCount + data.commentCount,
              engagementRate: data.engagementRate,
              title: data.caption?.substring(0, 50) + (data.caption && data.caption.length > 50 ? '...' : ''),
              fetchedAt: new Date().toISOString(),
            });
          } else {
            analytics.push({
              url,
              platform: 'instagram',
              viewCount: 0,
              engagementCount: 0,
              engagementRate: 0,
              fetchedAt: new Date().toISOString(),
              error: 'Failed to fetch data',
            });
          }
        } else {
          console.warn(`Unsupported URL: ${url}`);
          toast.error(`Unsupported URL format: ${url}`);
        }
      } catch (error) {
        console.error(`Error fetching analytics for ${url}:`, error);
        // Still add the URL with error status
        analytics.push({
          url,
          platform: isYouTubeUrl(url) ? 'youtube' : 'instagram',
          viewCount: 0,
          engagementCount: 0,
          engagementRate: 0,
          fetchedAt: new Date().toISOString(),
          error: error.message || 'Unknown error',
        });
      }
    })();

    fetchPromises.push(fetchPromise);
  }

  // Wait for all fetches to complete
  await Promise.all(fetchPromises);

  return analytics;
}

export function calculateCampaignMetrics(analytics: ContentAnalytics[]): CampaignMetrics {
  const metrics: CampaignMetrics = {
    totalViews: 0,
    totalEngagement: 0,
    averageEngagementRate: 0,
    platformBreakdown: {
      youtube: { count: 0, views: 0, engagement: 0 },
      instagram: { count: 0, views: 0, engagement: 0 },
    },
  };

  let validAnalyticsCount = 0;
  let totalEngagementRate = 0;

  for (const item of analytics) {
    if (!item.error) {
      metrics.totalViews += item.viewCount;
      metrics.totalEngagement += item.engagementCount;
      totalEngagementRate += item.engagementRate;
      validAnalyticsCount++;

      // Platform breakdown
      const platform = metrics.platformBreakdown[item.platform];
      platform.count++;
      platform.views += item.viewCount;
      platform.engagement += item.engagementCount;
    }
  }

  // Calculate average engagement rate
  if (validAnalyticsCount > 0) {
    metrics.averageEngagementRate = totalEngagementRate / validAnalyticsCount;
  }

  return metrics;
}

export function validateContentUrl(url: string): { isValid: boolean; platform?: 'youtube' | 'instagram'; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();

  if (isYouTubeUrl(trimmedUrl)) {
    return { isValid: true, platform: 'youtube' };
  }

  if (isInstagramUrl(trimmedUrl)) {
    return { isValid: true, platform: 'instagram' };
  }

  return { isValid: false, error: 'URL must be a valid YouTube or Instagram link' };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}