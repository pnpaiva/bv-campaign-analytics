
-- Check if there are any campaigns in the database
SELECT 
    id,
    brand_name,
    creator_id,
    campaign_date,
    status,
    total_views,
    total_engagement,
    engagement_rate
FROM campaigns 
ORDER BY created_at DESC;

-- Check if there's any analytics data stored
SELECT 
    id,
    campaign_id,
    platform,
    content_url,
    views,
    engagement,
    likes,
    comments,
    engagement_rate,
    fetched_at
FROM analytics_data 
ORDER BY fetched_at DESC;

-- Check if there are any analytics jobs
SELECT 
    id,
    campaign_id,
    platform,
    status,
    error_message,
    created_at,
    started_at,
    completed_at
FROM analytics_jobs 
ORDER BY created_at DESC;

-- Check the API cache to see if YouTube data is being cached
SELECT 
    cache_key,
    platform,
    response_data,
    expires_at,
    created_at
FROM api_cache 
WHERE platform = 'youtube'
ORDER BY created_at DESC;
