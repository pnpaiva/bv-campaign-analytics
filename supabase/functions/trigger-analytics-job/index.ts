
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

    const { campaign_id, platforms } = await req.json();

    if (!campaign_id) {
      throw new Error('Campaign ID is required');
    }

    const platformsToProcess = platforms || ['youtube', 'instagram', 'tiktok'];
    const jobs = [];

    // Create analytics jobs for each platform
    for (const platform of platformsToProcess) {
      const { data: job, error } = await supabaseClient
        .from('analytics_jobs')
        .insert({
          campaign_id,
          platform,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error(`Failed to create job for ${platform}:`, error);
      } else {
        jobs.push(job);
      }
    }

    // Trigger the job processor
    const processorResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-analytics-jobs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log(`Created ${jobs.length} analytics jobs for campaign ${campaign_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        jobs_created: jobs.length,
        jobs,
        processor_triggered: processorResponse.ok
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error triggering analytics job:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
