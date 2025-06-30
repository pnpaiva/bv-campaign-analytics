
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

    console.log('Starting analytics job processing...');

    // Get pending jobs with campaign data
    const { data: pendingJobs, error: jobsError } = await supabaseClient
      .from('analytics_jobs')
      .select(`
        *,
        campaigns!inner(
          id,
          user_id,
          brand_name
        )
      `)
      .eq('status', 'pending')
      .limit(10);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('No pending jobs found');
      return new Response(
        JSON.stringify({ message: 'No pending jobs', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingJobs.length} jobs`);
    let processedCount = 0;

    for (const job of pendingJobs) {
      try {
        // Mark job as running
        await supabaseClient
          .from('analytics_jobs')
          .update({
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id);

        const platform = job.platform;
        const campaignId = job.campaign_id;
        
        console.log(`Processing job ${job.id} for campaign ${campaignId} on platform ${platform}`);

        // Get existing analytics data to find content URLs
        const { data: existingAnalytics } = await supabaseClient
          .from('analytics_data')
          .select('content_url')
          .eq('campaign_id', campaignId)
          .eq('platform', platform)
          .limit(1);

        let contentUrl = '';

        if (existingAnalytics && existingAnalytics.length > 0) {
          // Use existing content URL from analytics data
          contentUrl = existingAnalytics[0].content_url;
          console.log(`Found existing content URL: ${contentUrl}`);
        } else {
          // For YouTube, we'll look for any YouTube URLs in the system
          // This is a fallback - ideally URLs should be stored when creating campaigns
          console.log(`No existing content URL found for campaign ${campaignId}`);
          
          // Mark job as failed if no content URL found
          await supabaseClient
            .from('analytics_jobs')
            .update({
              status: 'failed',
              error_message: 'No content URL found for analytics processing',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          continue;
        }

        // Call the appropriate analytics function based on platform
        if (platform === 'youtube' && contentUrl) {
          console.log(`Fetching YouTube analytics for URL: ${contentUrl}`);
          
          const response = await supabaseClient.functions.invoke('fetch-youtube-analytics', {
            body: {
              campaign_id: campaignId,
              video_url: contentUrl
            }
          });

          if (response.error) {
            throw new Error(`Analytics fetch failed: ${response.error.message}`);
          }

          console.log(`Successfully fetched analytics for ${contentUrl}`);

          // Fetch comments for sentiment analysis
          const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
          const videoId = extractVideoId(contentUrl);
          
          if (videoId && youtubeApiKey) {
            try {
              const commentsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${youtubeApiKey}&maxResults=50`
              );

              if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                const comments = commentsData.items?.map((item: any) => 
                  item.snippet.topLevelComment.snippet.textDisplay
                ) || [];

                if (comments.length > 0) {
                  // Run sentiment analysis
                  await supabaseClient.functions.invoke('sentiment-analysis', {
                    body: {
                      comments,
                      campaign_id: campaignId,
                      content_url: contentUrl
                    }
                  });
                }
              }
            } catch (sentimentError) {
              console.log('Sentiment analysis failed, but continuing with main analytics:', sentimentError.message);
            }
          }
        }

        // Mark job as completed
        await supabaseClient
          .from('analytics_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Update campaign status to completed
        await supabaseClient
          .from('campaigns')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);

        processedCount++;
        console.log(`Completed job ${job.id} for campaign ${campaignId}`);

      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);
        
        // Mark job as failed
        await supabaseClient
          .from('analytics_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }

    // Clean up expired cache
    await supabaseClient.rpc('cleanup_expired_cache');

    console.log(`Job processing completed. Processed: ${processedCount}/${pendingJobs.length}`);

    return new Response(
      JSON.stringify({ 
        message: 'Job processing completed',
        processed: processedCount,
        total: pendingJobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing analytics jobs:', error);
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
