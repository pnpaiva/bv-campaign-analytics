
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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

    console.log('Direct analytics fetch for campaign:', campaign_id, 'video:', video_url);

    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Extract video ID from URL
    const videoId = extractVideoId(video_url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    console.log('Extracted video ID:', videoId);
    console.log('Using API key (first 10 chars):', youtubeApiKey.substring(0, 10) + '...');

    // Fetch video statistics from YouTube API
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${youtubeApiKey}`;
    
    const response = await fetch(youtubeUrl);
    
    console.log('YouTube API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error:', response.status, errorText);
      throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('YouTube API response:', JSON.stringify(data, null, 2));
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found on YouTube');
    }

    const video = data.items[0];
    const stats = video.statistics;
    
    const analyticsData = {
      views: parseInt(stats.viewCount) || 0,
      likes: parseInt(stats.likeCount) || 0,
      comments: parseInt(stats.commentCount) || 0,
      engagement: (parseInt(stats.likeCount) || 0) + (parseInt(stats.commentCount) || 0),
      title: video.snippet.title,
      publishedAt: video.snippet.publishedAt
    };

    // Calculate engagement rate
    const engagementRate = analyticsData.views > 0 
      ? (analyticsData.engagement / analyticsData.views) * 100 
      : 0;

    console.log('Real analytics data:', analyticsData);
    console.log('Calculated engagement rate:', engagementRate);

    // First, try to update existing analytics data
    const { error: updateError } = await supabaseClient
      .from('analytics_data')
      .update({
        views: analyticsData.views,
        engagement: analyticsData.engagement,
        likes: analyticsData.likes,
        comments: analyticsData.comments,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        fetched_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign_id)
      .eq('platform', 'youtube')
      .eq('content_url', video_url);

    if (updateError) {
      console.log('Update failed, attempting insert:', updateError);
      
      // If update fails, try insert (in case the record doesn't exist)
      const { error: insertError } = await supabaseClient
        .from('analytics_data')
        .insert({
          campaign_id,
          platform: 'youtube',
          content_url: video_url,
          views: analyticsData.views,
          engagement: analyticsData.engagement,
          likes: analyticsData.likes,
          comments: analyticsData.comments,
          engagement_rate: parseFloat(engagementRate.toFixed(2)),
          fetched_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error inserting analytics data:', insertError);
        throw insertError;
      }
    }

    console.log('Successfully stored/updated analytics data');

    // Update campaign totals
    const { error: campaignUpdateError } = await supabaseClient.rpc('update_campaign_totals', {
      campaign_uuid: campaign_id
    });

    if (campaignUpdateError) {
      console.error('Error updating campaign totals:', campaignUpdateError);
      throw campaignUpdateError;
    }

    console.log('Successfully updated campaign totals');

    // Update campaign status to completed
    await supabaseClient
      .from('campaigns')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id);

    console.log('Campaign status updated to completed');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...analyticsData,
          engagement_rate: engagementRate
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in direct YouTube analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
