
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
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${channelId}&key=${youtubeApiKey}`
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
    const contentDetails = channelInfo.contentDetails;

    const subscribers = parseInt(channelStats.subscriberCount) || 0;
    const totalViews = parseInt(channelStats.viewCount) || 0;
    const channelName = channelSnippet.title || '';
    const uploadsPlaylistId = contentDetails.relatedPlaylists.uploads;

    console.log('Channel stats:', { subscribers, totalViews, channelName, uploadsPlaylistId });

    // Get recent videos from uploads playlist
    let totalLikes = 0;
    let totalComments = 0;
    let videoCount = 0;

    if (uploadsPlaylistId) {
      console.log('Fetching recent videos from uploads playlist...');
      
      // Get recent videos (last 10)
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${youtubeApiKey}`
      );

      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        console.log('Playlist items count:', playlistData.items?.length || 0);

        if (playlistData.items && playlistData.items.length > 0) {
          // Get video IDs
          const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
          
          // Get video statistics
          const videoStatsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${youtubeApiKey}`
          );

          if (videoStatsResponse.ok) {
            const videoStatsData = await videoStatsResponse.json();
            console.log('Video statistics count:', videoStatsData.items?.length || 0);

            if (videoStatsData.items) {
              videoCount = videoStatsData.items.length;
              
              // Sum up likes and comments from recent videos
              for (const video of videoStatsData.items) {
                const stats = video.statistics;
                totalLikes += parseInt(stats.likeCount) || 0;
                totalComments += parseInt(stats.commentCount) || 0;
              }
              
              console.log('Aggregated video stats:', { videoCount, totalLikes, totalComments });
            }
          } else {
            console.error('Failed to fetch video statistics:', await videoStatsResponse.text());
          }
        }
      } else {
        console.error('Failed to fetch playlist items:', await playlistResponse.text());
      }
    }

    // Call our enhanced SQL function to store video data with engagement
    console.log('Calling enhanced update function...');
    const { error: sqlError } = await supabaseClient.rpc('update_youtube_channel_analytics', {
      p_creator_roster_id: creator_roster_id,
      p_channel_handle: channelSnippet.customUrl || null,
      p_channel_id: channelId,
      p_channel_name: channelName,
      p_subscribers: subscribers,
      p_total_views: totalViews,
      p_video_count: videoCount
    });

    // Also update with engagement data
    if (sqlError) {
      console.error('SQL function error:', sqlError);
    } else {
      console.log('Updating engagement data...');
      
      // Update the record with engagement data
      const { error: updateError } = await supabaseClient
        .from('youtube_analytics')
        .update({
          likes: totalLikes,
          comments: totalComments,
          daily_likes: totalLikes, // For now, treating as daily until we have historical comparison
          daily_comments: totalComments,
          engagement_rate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0
        })
        .eq('creator_roster_id', creator_roster_id)
        .eq('date_recorded', new Date().toISOString().split('T')[0]);

      if (updateError) {
        console.error('Engagement update error:', updateError);
      } else {
        console.log('Engagement data updated successfully');
      }
    }

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
          total_views: totalViews,
          video_count: videoCount,
          total_likes: totalLikes,
          total_comments: totalComments,
          engagement_rate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0
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
