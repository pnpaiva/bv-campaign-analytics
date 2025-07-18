import { toast } from 'sonner';

interface TikTokVideoData {
  url: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementRate: number;
  caption?: string;
  publishedAt?: string;
  authorUsername?: string;
  musicTitle?: string;
}

// Apify API configuration
const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN || '';
const APIFY_TIKTOK_ACTOR = import.meta.env.VITE_APIFY_TIKTOK_ACTOR || 'clockworks/free-tiktok-scraper';

export async function fetchTikTokData(url: string): Promise<TikTokVideoData | null> {
  if (!APIFY_API_TOKEN) {
    console.error('Apify API token not configured');
    toast.error('TikTok API not configured. Please add APIFY_API_TOKEN to your environment variables.');
    return null;
  }

  try {
    // Validate TikTok URL
    const tiktokUrlPattern = /^https?:\/\/(www\.|m\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+)/;
    if (!tiktokUrlPattern.test(url)) {
      toast.error('Invalid TikTok URL format');
      return null;
    }

    console.log('Starting Apify actor for TikTok URL:', url);

    // Start the Apify actor run
    const runEndpoint = `https://api.apify.com/v2/acts/${APIFY_TIKTOK_ACTOR}/runs?token=${APIFY_API_TOKEN}`;
    
    const runResponse = await fetch(runEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          postURLs: [url],
        }
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Apify API error: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('Apify TikTok run started with ID:', runId);

    // Wait for the run to complete
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      attempts++;

      if (attempts % 10 === 0) {
        console.log(`Still waiting for TikTok scraper to complete... (${attempts}s)`);
      }
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Apify run did not complete successfully. Status: ${runStatus}`);
    }

    console.log('Apify TikTok run completed successfully');

    // Get the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!resultsResponse.ok) {
      throw new Error('Failed to fetch results from Apify');
    }

    const results = await resultsResponse.json();
    
    if (!results || results.length === 0) {
      throw new Error('No data returned from TikTok scraper');
    }

    const videoData = results[0];
    console.log('TikTok data received:', videoData);

    // Parse the TikTok data based on the actor's response format
    const tiktokData: TikTokVideoData = {
      url,
      viewCount: videoData.playCount || videoData.videoMeta?.playCount || 0,
      likeCount: videoData.diggCount || videoData.videoMeta?.diggCount || 0,
      commentCount: videoData.commentCount || videoData.videoMeta?.commentCount || 0,
      shareCount: videoData.shareCount || videoData.videoMeta?.shareCount || 0,
      engagementRate: calculateEngagementRate(
        videoData.diggCount || 0,
        videoData.commentCount || 0,
        videoData.shareCount || 0,
        videoData.playCount || 0
      ),
      caption: videoData.text || videoData.videoMeta?.text,
      publishedAt: videoData.createTime ? new Date(videoData.createTime * 1000).toISOString() : undefined,
      authorUsername: videoData.authorMeta?.name || videoData.author,
      musicTitle: videoData.musicMeta?.musicName,
    };

    return tiktokData;
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    toast.error(`Failed to fetch TikTok data: ${error.message}`);
    return null;
  }
}

function calculateEngagementRate(likes: number, comments: number, shares: number, views: number): number {
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
}

export function isTikTokUrl(url: string): boolean {
  const tiktokUrlPattern = /^https?:\/\/(www\.|m\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+)/;
  return tiktokUrlPattern.test(url);
}