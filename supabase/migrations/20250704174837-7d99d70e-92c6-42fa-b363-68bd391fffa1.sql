
-- First, let's check what data we actually have and clean up any inconsistent data
SELECT 
  cr.creator_name,
  ya.date_recorded,
  ya.views,
  ya.subscribers,
  ya.daily_views,
  ya.daily_subscribers,
  ya.fetched_at
FROM youtube_analytics ya
JOIN creator_roster cr ON cr.id = ya.creator_roster_id
ORDER BY cr.creator_name, ya.date_recorded DESC
LIMIT 20;

-- Clear existing daily calculations to start fresh
UPDATE youtube_analytics 
SET 
  daily_views = 0,
  daily_subscribers = 0,
  daily_likes = 0,
  daily_comments = 0;

-- Create a more robust daily calculation function that handles edge cases
CREATE OR REPLACE FUNCTION calculate_accurate_daily_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update daily metrics using window functions for accurate day-to-day differences
  WITH daily_calculations AS (
    SELECT 
      id,
      creator_roster_id,
      date_recorded,
      views,
      subscribers,
      likes,
      comments,
      -- Calculate daily changes using LAG function
      GREATEST(0, 
        COALESCE(views - LAG(views) OVER (
          PARTITION BY creator_roster_id 
          ORDER BY date_recorded ASC
        ), views)
      ) as calculated_daily_views,
      GREATEST(0,
        COALESCE(subscribers - LAG(subscribers) OVER (
          PARTITION BY creator_roster_id 
          ORDER BY date_recorded ASC
        ), 0)
      ) as calculated_daily_subscribers,
      GREATEST(0,
        COALESCE(likes - LAG(likes) OVER (
          PARTITION BY creator_roster_id 
          ORDER BY date_recorded ASC
        ), 0)
      ) as calculated_daily_likes,
      GREATEST(0,
        COALESCE(comments - LAG(comments) OVER (
          PARTITION BY creator_roster_id 
          ORDER BY date_recorded ASC
        ), 0)
      ) as calculated_daily_comments
    FROM youtube_analytics
    ORDER BY creator_roster_id, date_recorded ASC
  )
  UPDATE youtube_analytics
  SET 
    daily_views = dc.calculated_daily_views,
    daily_subscribers = dc.calculated_daily_subscribers,
    daily_likes = dc.calculated_daily_likes,
    daily_comments = dc.calculated_daily_comments
  FROM daily_calculations dc
  WHERE youtube_analytics.id = dc.id;
  
  -- For the first day of each creator, set daily values equal to total values
  -- (since we don't have previous day to compare)
  WITH first_day_per_creator AS (
    SELECT DISTINCT ON (creator_roster_id)
      id,
      creator_roster_id,
      views,
      subscribers,
      likes,
      comments
    FROM youtube_analytics
    ORDER BY creator_roster_id, date_recorded ASC
  )
  UPDATE youtube_analytics
  SET 
    daily_views = fdpc.views,
    daily_subscribers = fdpc.subscribers,
    daily_likes = fdpc.likes,
    daily_comments = fdpc.comments
  FROM first_day_per_creator fdpc
  WHERE youtube_analytics.id = fdpc.id;
END;
$$;

-- Execute the accurate calculation
SELECT calculate_accurate_daily_metrics();

-- Create a view to easily see daily metrics for debugging
CREATE OR REPLACE VIEW daily_youtube_summary AS
SELECT 
  cr.creator_name,
  ya.date_recorded,
  ya.views as total_views,
  ya.subscribers as total_subscribers,
  ya.daily_views,
  ya.daily_subscribers,
  ya.daily_likes + ya.daily_comments as daily_engagement,
  ya.fetched_at
FROM youtube_analytics ya
JOIN creator_roster cr ON cr.id = ya.creator_roster_id
ORDER BY cr.creator_name, ya.date_recorded DESC;
