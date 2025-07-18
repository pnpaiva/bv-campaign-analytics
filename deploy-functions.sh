#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions..."
echo "=====================================\n"

# Deploy each function
echo "📦 Deploying fetch-youtube-analytics..."
npx supabase functions deploy fetch-youtube-analytics

echo "\n📦 Deploying fetch-instagram-analytics..."
npx supabase functions deploy fetch-instagram-analytics

echo "\n📦 Deploying fetch-tiktok-analytics..."
npx supabase functions deploy fetch-tiktok-analytics

echo "\n✅ All Edge Functions deployed!"
echo "\n📋 Verifying secrets are set..."
npx supabase secrets list

echo "\n⚠️  Make sure you have set the following secrets:"
echo "   - YOUTUBE_API_KEY"
echo "   - APIFY_API_KEY"
echo "   - APIFY_ACTOR_ID_INSTAGRAM (optional)"
echo "   - APIFY_ACTOR_ID_TIKTOK (optional)"
echo ""
echo "To set a secret:"
echo "   npx supabase secrets set SECRET_NAME=value"
echo ""
echo "To check function logs:"
echo "   npx supabase functions logs fetch-instagram-analytics --tail"
echo "   npx supabase functions logs fetch-youtube-analytics --tail"
echo "   npx supabase functions logs fetch-tiktok-analytics --tail"