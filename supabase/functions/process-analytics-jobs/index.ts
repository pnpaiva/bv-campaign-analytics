
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

    // Get pending jobs
    const { data: pendingJobs, error: jobsError } = await supabaseClient
      .from('analytics_jobs')
      .select(`
        *,
        campaigns!inner(
          id,
          user_id,
          creators!inner(
            platform_handles
          )
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
        
        // Get platform handles from creator
        const platformHandles = job.campaigns.creators.platform_handles;
        
        if (!platformHandles || !platformHandles[platform]) {
          throw new Error(`No ${platform} handle found for this campaign`);
        }

        const handle = platformHandles[platform];
        let contentUrl = '';

        // Generate content URL based on platform
        switch (platform) {
          case 'youtube':
            // For YouTube, we need the actual video URL
            // This would typically come from the campaign data
            contentUrl = `https://youtube.com/watch?v=${handle}`;
            break;
          case 'instagram':
            contentUrl = `https://instagram.com/p/${handle}`;
            break;
          case 'tiktok':
            contentUrl = `https://tiktok.com/@${handle}`;
            break;
        }

        // Call the appropriate analytics function
        if (platform === 'youtube') {
          const response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-youtube-analytics`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                campaign_id: campaignId,
                video_url: contentUrl
              })
            }
          );

          if (!response.ok) {
            throw new Error(`Analytics fetch failed: ${response.statusText}`);
          }

          // Fetch comments for sentiment analysis
          const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
          const videoId = extractVideoId(contentUrl);
          
          if (videoId && youtubeApiKey) {
            const commentsResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${youtubeApiKey}&maxResults=50`
            );

            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              const comments = commentsData.items?.map((item: any) => 
                item.snippet.topLevelComment.snippet.textDisplay
              ) || [];

              // Run sentiment analysis
              await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/sentiment-analysis`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    comments,
                    campaign_id: campaignId,
                    content_url: contentUrl
                  })
                }
              );
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
