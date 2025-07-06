
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

    if (!youtubeApiKey || !campaign_id || !video_url) {
      throw new Error('Missing required parameters');
    }

    // Extract video ID from URL
    const videoIdMatch = video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL format');
    }
    const videoId = videoIdMatch[1];
    console.log('Extracted video ID:', videoId);

    // Make direct YouTube API call
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${youtubeApiKey}`;
    console.log('Calling YouTube API...');
    
    const response = await fetch(youtubeUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error:', response.status, errorText);
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('YouTube API response:', data);
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
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
      throw sqlError;
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
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
