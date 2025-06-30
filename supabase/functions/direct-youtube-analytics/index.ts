
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

    console.log('=== Direct YouTube Analytics Function Called ===');
    console.log('Campaign ID:', campaign_id);
    console.log('Video URL:', video_url);
    console.log('API Key available:', !!youtubeApiKey);

    if (!campaign_id) {
      throw new Error('Campaign ID is required');
    }

    if (!video_url) {
      throw new Error('Video URL is required');
    }

    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Extract video ID from URL
    const videoId = extractVideoId(video_url);
    if (!videoId) {
      console.error('Failed to extract video ID from URL:', video_url);
      throw new Error('Invalid YouTube URL format');
    }

    console.log('Extracted video ID:', videoId);

    // Fetch video statistics from YouTube API
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${youtubeApiKey}`;
    
    console.log('Making YouTube API request...');
    const response = await fetch(youtubeUrl);
    
    console.log('YouTube API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API error response:', errorText);
      throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('YouTube API response data:', JSON.stringify(data, null, 2));
    
    if (!data.items || data.items.length === 0) {
      console.error('No video found in YouTube response');
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

    const engagementRate = analyticsData.views > 0 
      ? (analyticsData.engagement / analyticsData.views) * 100 
      : 0;

    console.log('Processed analytics data:', analyticsData);
    console.log('Calculated engagement rate:', engagementRate);

    // Check if analytics data already exists for this campaign and URL
    const { data: existingData, error: selectError } = await supabaseClient
      .from('analytics_data')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('platform', 'youtube')
      .eq('content_url', video_url)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing analytics data:', selectError);
    }

    if (existingData) {
      console.log('Updating existing analytics record:', existingData.id);
      // Update existing record
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
        .eq('id', existingData.id);

      if (updateError) {
        console.error('Error updating analytics data:', updateError);
        throw updateError;
      }
    } else {
      console.log('Inserting new analytics record');
      // Insert new record
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
    console.log('Updating campaign totals...');
    const { error: campaignUpdateError } = await supabaseClient.rpc('update_campaign_totals', {
      campaign_uuid: campaign_id
    });

    if (campaignUpdateError) {
      console.error('Error updating campaign totals:', campaignUpdateError);
      throw campaignUpdateError;
    }

    console.log('Successfully updated campaign totals');

    // Update campaign status to completed
    const { error: statusUpdateError } = await supabaseClient
      .from('campaigns')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id);

    if (statusUpdateError) {
      console.error('Error updating campaign status:', statusUpdateError);
    }

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
    console.error('=== Error in direct YouTube analytics ===');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
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

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
