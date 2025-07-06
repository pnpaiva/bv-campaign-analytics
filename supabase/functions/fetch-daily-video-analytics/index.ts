
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Fetch Daily Video Analytics Function Started ===');
    
    const { creator_roster_id, channel_url } = await req.json();
    console.log('Request data:', { creator_roster_id, channel_url });
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    console.log('YouTube API Key exists:', !!youtubeApiKey);
    console.log('Supabase URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('Service role key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    if (!youtubeApiKey) {
      console.error('YouTube API key not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!creator_roster_id || !channel_url) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing creator_roster_id or channel_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract channel ID from URL
    let channelId = '';
    
    if (channel_url.includes('channel/')) {
      channelId = channel_url.split('channel/')[1].split('/')[0];
      console.log(`Extracted channel ID from URL: ${channelId}`);
    } else if (channel_url.includes('@')) {
      const username = channel_url.split('@')[1].split('/')[0];
      console.log(`Looking up channel ID for username: ${username}`);
      
      const handleResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${username}&key=${youtubeApiKey}`
      );
      
      console.log('Handle lookup response status:', handleResponse.status);
      
      if (handleResponse.ok) {
        const handleData = await handleResponse.json();
        console.log('Handle lookup response:', handleData);
        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].id;
        }
      } else {
        const errorText = await handleResponse.text();
        console.error('Handle lookup failed:', errorText);
      }
    }

    if (!channelId) {
      console.error('Could not extract channel ID from URL:', channel_url);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract channel ID from URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found channel ID: ${channelId}`);

    // Get channel statistics from YouTube API
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${youtubeApiKey}`
    );

    console.log('Channel API response status:', channelResponse.status);

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error('YouTube API error:', channelResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `YouTube API error: ${channelResponse.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelData = await channelResponse.json();
    console.log('YouTube API response:', channelData);
    
    if (!channelData.items || channelData.items.length === 0) {
      console.error('Channel not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Channel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelInfo = channelData.items[0];
    const channelStats = channelInfo.statistics;
    const channelSnippet = channelInfo.snippet;

    const subscribers = parseInt(channelStats.subscriberCount) || 0;
    const totalViews = parseInt(channelStats.viewCount) || 0;
    const channelName = channelSnippet.title || '';

    console.log('Channel stats:', { subscribers, totalViews, channelName });

    // Call our SQL function directly
    console.log('Calling direct_update_roster function...');
    const { error: sqlError } = await supabaseClient.rpc('direct_update_roster', {
      p_creator_roster_id: creator_roster_id,
      p_channel_id: channelId,
      p_channel_name: channelName,
      p_subscribers: subscribers,
      p_total_views: totalViews
    });

    if (sqlError) {
      console.error('SQL function error:', sqlError);
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${sqlError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Roster data updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          channel_id: channelId,
          channel_name: channelName,
          subscribers,
          total_views: totalViews
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: `Function error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
