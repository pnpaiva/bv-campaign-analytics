import { toast } from 'sonner';

interface InstagramPostData {
  url: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  caption?: string;
  publishedAt?: string;
  mediaType: 'photo' | 'video' | 'reel';
  ownerUsername?: string;
}

// Apify API configuration
const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN || '';
const APIFY_ACTOR = import.meta.env.VITE_APIFY_INSTAGRAM_ACTOR || 'apify/instagram-post-scraper';

export async function fetchInstagramData(url: string): Promise<InstagramPostData | null> {
  if (!APIFY_API_TOKEN) {
    console.error('Apify API token not configured');
    toast.error('Instagram API not configured. Please add APIFY_API_TOKEN to your environment variables.');
    return null;
  }

  try {
    // Validate Instagram URL
    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
    if (!instagramUrlPattern.test(url)) {
      toast.error('Invalid Instagram URL format');
      return null;
    }

    console.log('Starting Apify actor for Instagram URL:', url);

    // Use the specific endpoint format you provided
    const runEndpoint = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${APIFY_API_TOKEN}`;
    
    const runResponse = await fetch(runEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          directUrls: [url],
          resultsType: 'posts',
          resultsLimit: 1,
          addParentData: false,
        }
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Apify API error: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('Apify run started with ID:', runId);

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
        console.log(`Still waiting for Apify run to complete... (${attempts}s)`);
      }
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Apify run did not complete successfully. Status: ${runStatus}`);
    }

    console.log('Apify run completed successfully');

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
      throw new Error('No data returned from Instagram scraper');
    }

    const postData = results[0];
    console.log('Instagram data received:', postData);

    // Parse the Instagram data based on the actor's response format
    const instagramData: InstagramPostData = {
      url,
      viewCount: postData.videoViewCount || postData.videoPlayCount || 0,
      likeCount: postData.likesCount || 0,
      commentCount: postData.commentsCount || 0,
      engagementRate: calculateEngagementRate(
        postData.likesCount || 0,
        postData.commentsCount || 0,
        postData.videoViewCount || postData.videoPlayCount || 0
      ),
      caption: postData.caption || postData.text,
      publishedAt: postData.timestamp,
      mediaType: determineMediaType(postData.type || url),
      ownerUsername: postData.ownerUsername,
    };

    return instagramData;
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    toast.error(`Failed to fetch Instagram data: ${error.message}`);
    return null;
  }
}

function calculateEngagementRate(likes: number, comments: number, views: number): number {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

function determineMediaType(typeOrUrl: string): 'photo' | 'video' | 'reel' {
  if (typeOrUrl.includes('reel')) return 'reel';
  if (typeOrUrl.includes('video') || typeOrUrl.includes('tv')) return 'video';
  return 'photo';
}

export function isInstagramUrl(url: string): boolean {
  const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
  return instagramUrlPattern.test(url);
}