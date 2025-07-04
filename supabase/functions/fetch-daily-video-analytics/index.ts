
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
    
    if (!creator_roster_id || !channel_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured')
    }

    // Extract channel ID from URL with improved parsing
    let channelId = ''
    const url = new URL(channel_url)
    
    if (channel_url.includes('channel/')) {
      channelId = channel_url.split('channel/')[1].split('/')[0]
    } else if (channel_url.includes('@')) {
      // Handle @username format by getting channel ID first
      const username = channel_url.split('@')[1].split('/')[0]
      console.log(`Looking up channel ID for username: ${username}`)
      
      // Try the channels API with forHandle parameter (newer method)
      const handleResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${username}&key=${youtubeApiKey}`
      )
      
      if (handleResponse.ok) {
        const handleData = await handleResponse.json()
        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].id
        }
      }
      
      // Fallback to search API if forHandle doesn't work
      if (!channelId) {
        console.log(`Trying search API for: ${username}`)
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&maxResults=1&key=${youtubeApiKey}`
        )
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.items && searchData.items.length > 0) {
            channelId = searchData.items[0].snippet.channelId
          }
        }
      }
    } else if (url.pathname.startsWith('/c/')) {
      // Handle /c/customname format
      const customName = url.pathname.split('/c/')[1].split('/')[0]
      console.log(`Looking up channel ID for custom name: ${customName}`)
      
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(customName)}&maxResults=1&key=${youtubeApiKey}`
      )
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId
        }
      }
    }

    if (!channelId) {
      console.error('Could not extract channel ID from URL:', channel_url)
      return new Response(
        JSON.stringify({ 
          error: 'Could not extract channel ID from URL. Please ensure the URL is a valid YouTube channel URL.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully found channel ID: ${channelId} for URL: ${channel_url}`)

    // Get recent videos from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const publishedAfter = thirtyDaysAgo.toISOString()

    // Step 1: Search for recent videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&publishedAfter=${publishedAfter}&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) {
      throw new Error(`YouTube API search error: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    console.log(`Found ${searchData.items?.length || 0} recent videos`)

    if (!searchData.items || searchData.items.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recent videos found', videos_processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract video IDs
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')

    // Step 2: Get detailed statistics for these videos
    const statisticsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
    )

    if (!statisticsResponse.ok) {
      throw new Error(`YouTube API statistics error: ${statisticsResponse.status}`)
    }

    const statisticsData = await statisticsResponse.json()
    console.log(`Got statistics for ${statisticsData.items?.length || 0} videos`)

    // Step 3: Process and store video data
    const videoInserts = []
    const processedVideos = []

    for (const video of statisticsData.items || []) {
      const stats = video.statistics || {}
      const snippet = video.snippet || {}
      const contentDetails = video.contentDetails || {}

      const videoData = {
        creator_roster_id,
        video_id: video.id,
        title: snippet.title || '',
        published_at: snippet.publishedAt,
        views: parseInt(stats.viewCount) || 0,
        likes: parseInt(stats.likeCount) || 0,
        comments: parseInt(stats.commentCount) || 0,
        duration: contentDetails.duration || '',
        thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        fetched_at: new Date().toISOString()
      }

      videoInserts.push(videoData)
      processedVideos.push({
        video_id: video.id,
        title: snippet.title,
        published_at: snippet.publishedAt,
        views: videoData.views,
        likes: videoData.likes,
        comments: videoData.comments
      })
    }

    // Step 4: Insert/update video analytics data
    if (videoInserts.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('video_analytics')
        .upsert(videoInserts, { 
          onConflict: 'creator_roster_id,video_id',
          ignoreDuplicates: false 
        })

      if (insertError) {
        console.error('Error inserting video analytics:', insertError)
        throw insertError
      }

      console.log(`Successfully processed ${videoInserts.length} videos`)
    }

    // Step 5: Update channel subscriber count (keep existing functionality)
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${youtubeApiKey}`
    )

    if (channelResponse.ok) {
      const channelData = await channelResponse.json()
      if (channelData.items && channelData.items.length > 0) {
        const channelStats = channelData.items[0].statistics
        const subscribers = parseInt(channelStats.subscriberCount) || 0

        // Update the youtube_analytics table with current subscriber count
        const { error: updateError } = await supabaseClient
          .from('youtube_analytics')
          .upsert({
            creator_roster_id,
            channel_id: channelId,
            subscribers,
            date_recorded: new Date().toISOString().split('T')[0],
            fetched_at: new Date().toISOString()
          }, { 
            onConflict: 'creator_roster_id,date_recorded',
            ignoreDuplicates: false 
          })

        if (updateError) {
          console.error('Error updating subscriber count:', updateError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        videos_processed: videoInserts.length,
        channel_id: channelId,
        processed_videos: processedVideos.slice(0, 5) // Return first 5 for debugging
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-daily-video-analytics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
