import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface InstagramAnalyticsRequest {
  url: string
}

interface InstagramAnalyticsResponse {
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
    const { url } = await req.json() as InstagramAnalyticsRequest

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract Instagram post ID from URL
    const postIdMatch = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/)([A-Za-z0-9_-]+)/)
    if (!postIdMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid Instagram URL format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const postId = postIdMatch[1]

    // Note: Instagram's official API requires authentication and app review
    // For now, we'll return mock data or you can integrate with a third-party service
    // In production, you'd use Instagram Basic Display API or Instagram Graph API

    // Mock data for demonstration
    const mockData: InstagramAnalyticsResponse = {
      views: Math.floor(Math.random() * 100000) + 10000,
      engagement: Math.floor(Math.random() * 10000) + 1000,
      rate: parseFloat((Math.random() * 10 + 1).toFixed(1))
    }

    // TODO: Replace with actual Instagram API call
    // const response = await fetch(`https://graph.instagram.com/${postId}?fields=...&access_token=...`)
    // const data = await response.json()

    return new Response(
      JSON.stringify(mockData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in fetch-instagram-analytics:', error)
    
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