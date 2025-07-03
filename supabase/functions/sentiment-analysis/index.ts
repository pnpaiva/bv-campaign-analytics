
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

    const { comments, campaign_id, content_url } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!comments || comments.length === 0) {
      console.log('No comments to analyze');
      return new Response(
        JSON.stringify({ 
          sentiment_score: 0, 
          sentiment_label: 'neutral',
          analyzed_comments: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare comments for analysis (limit to avoid token limits)
    const commentsToAnalyze = comments.slice(0, 50).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the sentiment of social media comments and return a JSON response with:
            - sentiment_score: a number between -1 (very negative) and 1 (very positive)
            - sentiment_label: one of "positive", "negative", or "neutral"
            - summary: a brief explanation of the overall sentiment
            
            Consider the overall tone, emotional language, and context of the comments.`
          },
          {
            role: 'user',
            content: `Analyze the sentiment of these comments:\n\n${commentsToAnalyze}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Update analytics data with sentiment
    await supabaseClient
      .from('analytics_data')
      .update({
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign_id)
      .eq('content_url', content_url);

    console.log('Sentiment analysis completed for:', content_url);

    return new Response(
      JSON.stringify({
        success: true,
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        summary: analysis.summary,
        analyzed_comments: comments.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
