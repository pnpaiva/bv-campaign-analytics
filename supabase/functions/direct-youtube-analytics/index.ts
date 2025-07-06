
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
    const engagement = likes + comments;
    const engagementRate = views > 0 ? (engagement / views) * 100 : 0;

    console.log('Video stats:', { views, likes, comments, engagement });

    // Store in analytics_data table
    const { error: insertError } = await supabaseClient
      .from('analytics_data')
      .upsert({
        campaign_id,
        platform: 'youtube',
        content_url: video_url,
        views,
        engagement,
        likes,
        comments,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'campaign_id,content_url'
      });

    if (insertError) {
      console.error('Database error:', insertError);
      throw insertError;
    }

    // Update campaign totals
    const { error: updateError } = await supabaseClient.rpc('update_campaign_totals', {
      campaign_uuid: campaign_id
    });

    if (updateError) {
      console.error('Campaign update error:', updateError);
    }

    console.log('Successfully stored analytics data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { views, engagement, likes, comments, engagement_rate: engagementRate }
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
