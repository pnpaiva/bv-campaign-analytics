-- Create a function to properly calculate daily metrics using window functions
CREATE OR REPLACE FUNCTION calculate_proper_daily_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update daily metrics by calculating differences from previous day
  WITH daily_calculations AS (
    SELECT 
      id,
      creator_roster_id,
      date_recorded,
      views,
      subscribers, 
      likes,
      comments,
      -- Calculate daily differences using LAG window function
      GREATEST(0, COALESCE(views - LAG(views) OVER (
        PARTITION BY creator_roster_id 
        ORDER BY date_recorded ASC
      ), 0)) as calc_daily_views,
      GREATEST(0, COALESCE(subscribers - LAG(subscribers) OVER (
        PARTITION BY creator_roster_id 
        ORDER BY date_recorded ASC  
      ), 0)) as calc_daily_subscribers,
      GREATEST(0, COALESCE(likes - LAG(likes) OVER (
        PARTITION BY creator_roster_id 
        ORDER BY date_recorded ASC
      ), 0)) as calc_daily_likes,
      GREATEST(0, COALESCE(comments - LAG(comments) OVER (
        PARTITION BY creator_roster_id 
        ORDER BY date_recorded ASC
      ), 0)) as calc_daily_comments
    FROM youtube_analytics
    ORDER BY creator_roster_id, date_recorded ASC
  )
  UPDATE youtube_analytics
  SET 
    daily_views = dc.calc_daily_views,
    daily_subscribers = dc.calc_daily_subscribers,
    daily_likes = dc.calc_daily_likes,
    daily_comments = dc.calc_daily_comments
  FROM daily_calculations dc
  WHERE youtube_analytics.id = dc.id;
  
  -- Log the update
  RAISE NOTICE 'Daily metrics recalculated successfully';
END;
$$;