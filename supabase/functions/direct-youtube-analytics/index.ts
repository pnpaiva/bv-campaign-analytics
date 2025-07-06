
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaign_id, video_url } = await req.json();
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    console.log('Processing campaign:', campaign_id, 'URL:', video_url);

    if (!youtubeApiKey || !campaign_id || !video_url) {
      throw new Error('Missing required parameters');
    }

    // Extract video ID from URL
    const videoIdMatch = video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }
    const videoId = videoIdMatch[1];

    console.log('Fetching data for video:', videoId);

    // Fetch video statistics from YouTube API
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${youtubeApiKey}`;
    const response = await fetch(youtubeUrl);

    if (!response.ok) {
      console.error('YouTube API error:', response.status);
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const stats = video.statistics;
    
    const views = parseInt(stats.viewCount) || 0;
    const likes = parseInt(stats.likeCount) || 0;
    const comments = parseInt(stats.commentCount) || 0;
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

    console.log('Video stats:', { views, likes, comments, engagementRate });

    // Use the new simplified SQL function to update campaign directly
    const { error: updateError } = await supabaseClient.rpc('update_campaign_analytics', {
      p_campaign_id: campaign_id,
      p_video_url: video_url,
      p_views: views,
      p_likes: likes,
      p_comments: comments,
      p_engagement_rate: parseFloat(engagementRate.toFixed(2))
    });

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Successfully updated campaign analytics');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { views, engagement: likes + comments, likes, comments, engagement_rate: engagementRate }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in direct-youtube-analytics:', error);
    
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
