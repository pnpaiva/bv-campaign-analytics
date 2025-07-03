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

    const { creator_roster_id, channel_url } = await req.json();
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    console.log('=== YouTube Channel Analytics Function Called ===');
    console.log('Creator Roster ID:', creator_roster_id);
    console.log('Channel URL:', channel_url);
    console.log('API Key available:', !!youtubeApiKey);

    if (!creator_roster_id) {
      throw new Error('Creator roster ID is required');
    }

    if (!channel_url) {
      throw new Error('Channel URL is required');
    }

    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Extract channel info from URL
    const channelInfo = extractChannelInfo(channel_url);
    if (!channelInfo) {
      console.error('Failed to extract channel info from URL:', channel_url);
      throw new Error('Invalid YouTube channel URL format');
    }

    console.log('Extracted channel info:', channelInfo);

    // Check cache first
    const cacheKey = `youtube_channel_${channelInfo.id || channelInfo.handle}`;
    const { data: cachedData } = await supabaseClient
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    let analyticsData;

    if (cachedData) {
      console.log('Using cached data for channel:', channelInfo.id || channelInfo.handle);
      analyticsData = cachedData.response_data;
    } else {
      console.log('Fetching fresh data for channel:', channelInfo.id || channelInfo.handle);
      
      // Build YouTube API URL for channel statistics
      let youtubeUrl;
      if (channelInfo.id) {
        youtubeUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelInfo.id}&key=${youtubeApiKey}`;
      } else if (channelInfo.handle) {
        youtubeUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forHandle=${channelInfo.handle}&key=${youtubeApiKey}`;
      }
      
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
        console.error('No channel found in YouTube response');
        throw new Error('Channel not found on YouTube');
      }

      const channel = data.items[0];
      const stats = channel.statistics;
      
      analyticsData = {
        channel_id: channel.id,
        channel_name: channel.snippet.title,
        channel_handle: channelInfo.handle,
        subscribers: parseInt(stats.subscriberCount) || 0,
        views: parseInt(stats.viewCount) || 0,
        video_count: parseInt(stats.videoCount) || 0,
        engagement: parseInt(stats.subscriberCount) || 0 // Use subscribers as engagement for channels
      };

      console.log('Processed channel analytics data:', analyticsData);

      // Cache the response for 1 hour
      await supabaseClient
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          platform: 'youtube',
          response_data: analyticsData,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
        });

      console.log('Cached channel analytics data');
    }

    // Store the channel analytics in youtube_analytics table
    const { error: insertError } = await supabaseClient
      .from('youtube_analytics')
      .upsert({
        creator_roster_id,
        channel_id: analyticsData.channel_id,
        channel_name: analyticsData.channel_name,
        channel_handle: analyticsData.channel_handle,
        subscribers: analyticsData.subscribers,
        views: analyticsData.views,
        date_recorded: new Date().toISOString().split('T')[0],
        fetched_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting YouTube analytics data:', insertError);
      throw insertError;
    }

    console.log('Successfully stored YouTube channel analytics in database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analyticsData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== Error in YouTube channel analytics ===');
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

function extractChannelInfo(url: string): { id?: string; handle?: string } | null {
  try {
    const urlObj = new URL(url);
    
    // Handle different YouTube channel URL formats
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const pathname = urlObj.pathname;
      
      // Format: /channel/UCxxxxxx
      if (pathname.startsWith('/channel/')) {
        const channelId = pathname.split('/channel/')[1];
        return { id: channelId };
      }
      
      // Format: /@handle or /c/customname or /user/username
      if (pathname.startsWith('/@')) {
        const handle = pathname.split('/@')[1];
        return { handle: handle };
      }
      
      if (pathname.startsWith('/c/')) {
        const customName = pathname.split('/c/')[1];
        return { handle: customName };
      }
      
      if (pathname.startsWith('/user/')) {
        const username = pathname.split('/user/')[1];
        return { handle: username };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing channel URL:', error);
    return null;
  }
}