import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
const APIFY_TIKTOK_ACTOR_ID = 'OtzYfK1ndEGdwWFKQ';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      throw new Error('TikTok URL is required');
    }

    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY is not configured');
    }

    console.log('Fetching TikTok analytics for URL:', url);

    // Prepare input for Apify TikTok Actor
    const input = {
      postURLs: [url],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false
    };

    // Run the actor
    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_TIKTOK_ACTOR_ID}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Apify API error:', error);
      throw new Error(`Apify API error: ${response.status} - ${error}`);
    }

    const runData = await response.json();
    const runId = runData.data.id;

    // Wait for the run to complete (with timeout)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`
      );
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check actor run status');
      }
      
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${status}`);
    }

    // Get the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}`
    );

    if (!resultsResponse.ok) {
      throw new Error('Failed to fetch actor results');
    }

    const results = await resultsResponse.json();
    
    if (!results || results.length === 0) {
      throw new Error('No data found for the TikTok URL');
    }

    const video = results[0];
    
    // Extract analytics data
    const analytics = {
      views: video.playCount || video.videoMeta?.playCount || 0,
      likes: video.diggCount || video.videoMeta?.diggCount || 0,
      comments: video.commentCount || video.videoMeta?.commentCount || 0,
      shares: video.shareCount || video.videoMeta?.shareCount || 0,
      url: url,
      platform: 'tiktok'
    };

    return new Response(
      JSON.stringify(analytics),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in TikTok analytics function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch TikTok analytics',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});