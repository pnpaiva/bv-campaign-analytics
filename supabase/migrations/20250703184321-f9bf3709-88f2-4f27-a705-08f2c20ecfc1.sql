
-- Add a function to calculate daily differences from cumulative YouTube data
CREATE OR REPLACE FUNCTION calculate_daily_youtube_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create a temporary table to store calculated daily metrics
  CREATE TEMP TABLE IF NOT EXISTS daily_metrics AS
  WITH ordered_data AS (
    SELECT 
      creator_roster_id,
      date_recorded,
      views,
      subscribers,
      likes,
      comments,
      LAG(views) OVER (PARTITION BY creator_roster_id ORDER BY date_recorded) as prev_views,
      LAG(subscribers) OVER (PARTITION BY creator_roster_id ORDER BY date_recorded) as prev_subscribers,
      LAG(likes) OVER (PARTITION BY creator_roster_id ORDER BY date_recorded) as prev_likes,
      LAG(comments) OVER (PARTITION BY creator_roster_id ORDER BY date_recorded) as prev_comments
    FROM youtube_analytics
    WHERE date_recorded >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY creator_roster_id, date_recorded
  )
  SELECT 
    creator_roster_id,
    date_recorded,
    GREATEST(0, COALESCE(views - prev_views, 0)) as daily_views,
    GREATEST(0, COALESCE(subscribers - prev_subscribers, 0)) as daily_subscribers,
    GREATEST(0, COALESCE(likes - prev_likes, 0)) as daily_likes,
    GREATEST(0, COALESCE(comments - prev_comments, 0)) as daily_comments,
    views as total_views,
    subscribers as total_subscribers
  FROM ordered_data
  WHERE prev_views IS NOT NULL; -- Skip first day for each creator as we can't calculate difference

  -- Update youtube_analytics with calculated daily metrics
  UPDATE youtube_analytics 
  SET 
    daily_views = dm.daily_views,
    daily_subscribers = dm.daily_subscribers,
    daily_likes = dm.daily_likes,
    daily_comments = dm.daily_comments
  FROM daily_metrics dm
  WHERE youtube_analytics.creator_roster_id = dm.creator_roster_id 
    AND youtube_analytics.date_recorded = dm.date_recorded;

  DROP TABLE IF EXISTS daily_metrics;
END;
$$;

-- Add columns for daily metrics if they don't exist
ALTER TABLE youtube_analytics 
ADD COLUMN IF NOT EXISTS daily_views bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_subscribers bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_likes bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_comments bigint DEFAULT 0;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_youtube_analytics_creator_date 
ON youtube_analytics(creator_roster_id, date_recorded);

-- Run the calculation function
SELECT calculate_daily_youtube_metrics();
