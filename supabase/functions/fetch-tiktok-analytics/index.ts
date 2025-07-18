import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface TikTokAnalyticsRequest {
  url: string
}

interface TikTokAnalyticsResponse {
  views?: number
  engagement?: number
  rate?: number
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json() as TikTokAnalyticsRequest

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract TikTok video ID from URL
    const videoIdMatch = url.match(/(?:tiktok\.com\/@[\w.-]+\/video\/|tiktok\.com\/v\/)([\d]+)/)
    if (!videoIdMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid TikTok URL format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const videoId = videoIdMatch[1]

    // Note: TikTok's official API requires app approval and authentication
    // For now, we'll return mock data or you can integrate with a third-party service
    // In production, you'd use TikTok Display API or a scraping service

    // Mock data for demonstration
    const mockData: TikTokAnalyticsResponse = {
      views: Math.floor(Math.random() * 500000) + 25000,
      engagement: Math.floor(Math.random() * 25000) + 2500,
      rate: parseFloat((Math.random() * 8 + 2).toFixed(1))
    }

    // TODO: Replace with actual TikTok API call or third-party service
    // const response = await fetch(`https://api.tiktok.com/...`)
    // const data = await response.json()

    return new Response(
      JSON.stringify(mockData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in fetch-tiktok-analytics:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})