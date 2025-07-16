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
    
    console.log('=== TikTok Analytics Fetch ===');
    console.log('Campaign ID:', campaign_id);
    console.log('Content URL:', content_url);

    if (!campaign_id || !content_url) {
      throw new Error('Missing required parameters: campaign_id and content_url');
    }

    // Validate TikTok URL format
    const tiktokRegex = /(?:tiktok\.com\/@[\w.-]+\/video\/(\d+))/;
    const match = content_url.match(tiktokRegex);
    
    if (!match) {
      throw new Error('Invalid TikTok URL format');
    }

    const videoId = match[1];
    console.log('TikTok Video ID:', videoId);

    // Call Apify TikTok actor
    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/OtzYfK1ndEGdwWFKQ/run-sync-get-dataset-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postURLs: [content_url],
        resultsLimit: 1
      })
    });

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error('Apify API error:', errorText);
      throw new Error(`Apify API error: ${apifyResponse.status} - ${errorText}`);
    }

    const apifyData = await apifyResponse.json();
    console.log('Apify response:', apifyData);

    if (!apifyData || apifyData.length === 0) {
      throw new Error('No data returned from Apify');
    }

    const postData = apifyData[0];
    const views = postData.playCount || 0;
    const likes = postData.diggCount || 0;
    const comments = postData.commentCount || 0;
    const shares = postData.shareCount || 0;
    const engagement = likes + comments + shares;

    console.log('Extracted data:', { views, likes, comments, shares, engagement });

    // Update campaign analytics
    const { error: updateError } = await supabase.rpc('direct_update_campaign', {
      p_campaign_id: campaign_id,
      p_video_url: content_url,
      p_views: views,
      p_likes: likes,
      p_comments: comments
    });

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    const responseData = {
      success: true,
      data: {
        views,
        likes,
        comments,
        shares,
        engagement,
        platform: 'tiktok'
      }
    };

    console.log('Success response:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TikTok analytics error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch TikTok analytics'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});