#!/bin/bash

# Deploy Supabase Edge Functions

echo "🚀 Deploying Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy each function
echo "📦 Deploying fetch-instagram-analytics..."
supabase functions deploy fetch-instagram-analytics

echo "📦 Deploying fetch-youtube-analytics..."
supabase functions deploy fetch-youtube-analytics

echo "📦 Deploying fetch-tiktok-analytics..."
supabase functions deploy fetch-tiktok-analytics

echo "✅ All Edge Functions deployed successfully!"

# Optional: Set up environment variables
echo ""
echo "📌 Don't forget to set up your API keys:"
echo "   supabase secrets set YOUTUBE_API_KEY=your-api-key-here"
echo ""
echo "🔍 To check function logs:"
echo "   supabase functions logs fetch-instagram-analytics --tail"
echo "   supabase functions logs fetch-youtube-analytics --tail"
echo "   supabase functions logs fetch-tiktok-analytics --tail"