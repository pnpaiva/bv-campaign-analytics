
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Direct YouTube Analytics Function Started ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaign_id, video_url } = await req.json();
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    console.log('Request data:', { campaign_id, video_url });
    console.log('YouTube API Key exists:', !!youtubeApiKey);

    if (!youtubeApiKey) {
      console.error('YouTube API key not found');
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!campaign_id || !video_url) {
      console.error('Missing required parameters:', { campaign_id, video_url });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing campaign_id or video_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID from URL
    const videoIdMatch = video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      console.error('Invalid YouTube URL format:', video_url);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid YouTube URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const videoId = videoIdMatch[1];
    console.log('Extracted video ID:', videoId);

    // Make direct YouTube API call
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${youtubeApiKey}`;
    console.log('Calling YouTube API...');
    
    const response = await fetch(youtubeUrl);
    console.log('YouTube API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `YouTube API error: ${response.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('YouTube API response:', data);
    
    if (!data.items || data.items.length === 0) {
      console.error('Video not found in YouTube API response');
      return new Response(
        JSON.stringify({ success: false, error: 'Video not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const video = data.items[0];
    const stats = video.statistics;
    
    const views = parseInt(stats.viewCount) || 0;
    const likes = parseInt(stats.likeCount) || 0;
    const comments = parseInt(stats.commentCount) || 0;

    console.log('Parsed stats:', { views, likes, comments });

    // Call our SQL function directly
    console.log('Calling direct_update_campaign function...');
    const { error: sqlError } = await supabaseClient.rpc('direct_update_campaign', {
      p_campaign_id: campaign_id,
      p_video_url: video_url,
      p_views: views,
      p_likes: likes,
      p_comments: comments
    });

    if (sqlError) {
      console.error('SQL function error:', sqlError);
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${sqlError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Campaign updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          views, 
          likes, 
          comments, 
          engagement: likes + comments,
          engagement_rate: views > 0 ? ((likes + comments) / views * 100).toFixed(2) : 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Function error: ${error.message}` 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
