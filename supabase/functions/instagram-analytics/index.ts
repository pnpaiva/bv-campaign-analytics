import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
const APIFY_INSTAGRAM_ACTOR_ID = 'nH2AHrwxeTRJoN5hX';

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
      throw new Error('Instagram URL is required');
    }

    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY is not configured');
    }

    console.log('Fetching Instagram analytics for URL:', url);

    // Prepare input for Apify Instagram Actor
    const input = {
      username: [url],
      resultsLimit: 1
    };

    // Run the actor
    const response = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_INSTAGRAM_ACTOR_ID}/runs?token=${APIFY_API_KEY}`,
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
      throw new Error('No data found for the Instagram URL');
    }

    const post = results[0];
    
    // Extract analytics data
    const analytics = {
      views: post.videoViewCount || 0,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      shares: 0, // Instagram doesn't provide share count
      url: url,
      platform: 'instagram'
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
    console.error('Error in Instagram analytics function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch Instagram analytics',
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