
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { creator_roster_id, channel_url } = await req.json()
    
    console.log('Processing creator:', creator_roster_id, 'Channel:', channel_url);
    
    if (!creator_roster_id || !channel_url) {
      throw new Error('Missing required parameters');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured')
    }

    // Extract channel ID from URL
    let channelId = ''
    
    if (channel_url.includes('channel/')) {
      channelId = channel_url.split('channel/')[1].split('/')[0]
    } else if (channel_url.includes('@')) {
      const username = channel_url.split('@')[1].split('/')[0]
      console.log(`Looking up channel ID for username: ${username}`)
      
      const handleResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${username}&key=${youtubeApiKey}`
      )
      
      if (handleResponse.ok) {
        const handleData = await handleResponse.json()
        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].id
        }
      }
    }

    if (!channelId) {
      throw new Error('Could not extract channel ID from URL');
    }

    console.log(`Found channel ID: ${channelId}`);

    // Get channel statistics
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${youtubeApiKey}`
    )

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.status}`)
    }

    const channelData = await channelResponse.json()
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel not found')
    }

    const channelInfo = channelData.items[0]
    const channelStats = channelInfo.statistics
    const channelSnippet = channelInfo.snippet

    const subscribers = parseInt(channelStats.subscriberCount) || 0
    const totalViews = parseInt(channelStats.viewCount) || 0
    const channelName = channelSnippet.title || ''

    console.log('Channel stats:', { subscribers, totalViews, channelName });

    // Use our simplified SQL function to refresh creator data
    const { error: updateError } = await supabaseClient.rpc('refresh_creator_roster_data', {
      p_creator_roster_id: creator_roster_id,
      p_channel_id: channelId,
      p_channel_name: channelName,
      p_subscribers: subscribers,
      p_total_views: totalViews
    });

    if (updateError) {
      console.error('Error updating creator data:', updateError);
      throw updateError;
    }

    console.log('Successfully updated creator roster data');

    return new Response(
      JSON.stringify({
        success: true,
        channel_id: channelId,
        subscribers,
        total_views: totalViews,
        channel_name: channelName
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-daily-video-analytics:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
