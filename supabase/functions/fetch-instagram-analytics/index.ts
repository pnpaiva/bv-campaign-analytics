import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apifyApiKey = Deno.env.get('APIFY_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, content_url } = await req.json();
    
    console.log('=== Instagram Analytics Fetch ===');
    console.log('Campaign ID:', campaign_id);
    console.log('Content URL:', content_url);
    console.log('Apify API Key present:', !!apifyApiKey);

    if (!campaign_id || !content_url) {
      throw new Error('Missing required parameters: campaign_id and content_url');
    }

    // Extract Instagram post ID from URL
    const instagramRegex = /instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/;
    const match = content_url.match(instagramRegex);
    
    if (!match) {
      throw new Error('Invalid Instagram URL format');
    }

    const postId = match[1];
    console.log('Instagram Post ID:', postId);

    // Call Apify Instagram Post Scraper API
    console.log('Calling Apify Instagram Post Scraper...');
    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-post-scraper/runs?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        directUrls: [content_url],
        resultsLimit: 1,
        addParentData: false,
        enhanceUserInformation: false,
        isUserTaggedFeedURL: false,
        isUserReelsFeedURL: false,
        isUserStoriesFeedURL: false,
        scrapePostsUntilDate: "2018-01-01",
        scrapePostsUntilCount: 1
      })
    });

    console.log('Apify Response Status:', apifyResponse.status);
    
    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Apify API error:', errorText);
      throw new Error(`Apify API error: ${apifyResponse.status} - ${errorText}`);
    }

    const runResponse = await apifyResponse.json();
    console.log('Apify Run Response:', runResponse);
    
    const runId = runResponse.data.id;
    console.log('Run ID:', runId);
    
    // Wait for the run to complete
    console.log('Waiting for run to complete...');
    let attempts = 0;
    let runStatus = 'RUNNING';
    
    while (runStatus === 'RUNNING' && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-post-scraper/runs/${runId}?token=${apifyApiKey}`);
      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      
      console.log(`Attempt ${attempts + 1}: Status = ${runStatus}`);
      attempts++;
    }
    
    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Run did not succeed. Final status: ${runStatus}`);
    }
    
    // Get the dataset items
    console.log('Fetching dataset items...');
    const datasetResponse = await fetch(`https://api.apify.com/v2/acts/apify~instagram-post-scraper/runs/${runId}/dataset/items?token=${apifyApiKey}`);
    
    if (!datasetResponse.ok) {
      const errorText = await datasetResponse.text();
      console.error('Dataset fetch error:', errorText);
      throw new Error(`Dataset fetch error: ${datasetResponse.status} - ${errorText}`);
    }

    const apifyData = await datasetResponse.json();
    console.log('Dataset Items:', apifyData);

    if (!apifyData || apifyData.length === 0) {
      throw new Error('No data returned from Apify');
    }

    const postData = apifyData[0];
    console.log('Post Data:', postData);
    
    // Extract metrics from the Instagram post data
    const views = postData.videoViewCount || postData.videoPlayCount || postData.viewsCount || 0;
    const likes = postData.likesCount || 0;
    const comments = postData.commentsCount || 0;
    const engagement = likes + comments;

    console.log('Extracted Instagram metrics:', { views, likes, comments, engagement });

    // Store the analytics data in the database
    const { error: insertError } = await supabase
      .from('analytics_data')
      .insert({
        campaign_id,
        platform: 'instagram',
        content_url,
        views,
        likes,
        comments,
        engagement,
        engagement_rate: views > 0 ? (engagement / views * 100) : 0,
        fetched_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // Also update the campaign totals
    const { error: updateError } = await supabase.rpc('direct_update_campaign', {
      p_campaign_id: campaign_id,
      p_video_url: content_url,
      p_views: views,
      p_likes: likes,
      p_comments: comments
    });

    if (updateError) {
      console.error('Campaign update error:', updateError);
      // Don't throw here as the analytics data was already inserted
    }

    const responseData = {
      success: true,
      data: {
        views,
        likes,
        comments,
        engagement,
        engagement_rate: views > 0 ? (engagement / views * 100) : 0,
        platform: 'instagram'
      }
    };

    console.log('Success response:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Instagram analytics error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch Instagram analytics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});