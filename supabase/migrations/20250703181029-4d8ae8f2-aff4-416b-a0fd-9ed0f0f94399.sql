-- Create a simplified view for roster analytics that aggregates data properly
CREATE OR REPLACE VIEW public.roster_analytics_summary AS
SELECT 
  cr.id as creator_roster_id,
  cr.creator_name,
  cr.user_id,
  -- Get the latest data (most recent date)
  COALESCE(latest.subscribers, 0) as current_subscribers,
  COALESCE(latest.views, 0) as current_views,
  COALESCE(latest.engagement_rate, 0) as current_engagement_rate,
  -- Calculate totals across date range
  COALESCE(SUM(ya.views), 0) as total_views,
  COALESCE(SUM(ya.subscribers), 0) as total_engagement, -- Using subscribers as engagement for channels
  COALESCE(AVG(ya.engagement_rate), 0) as avg_engagement_rate,
  COUNT(ya.id) as data_points,
  MAX(ya.date_recorded) as last_update_date
FROM public.creator_roster cr
LEFT JOIN public.youtube_analytics ya ON cr.id = ya.creator_roster_id
LEFT JOIN (
  SELECT DISTINCT ON (creator_roster_id) 
    creator_roster_id, subscribers, views, engagement_rate, date_recorded
  FROM public.youtube_analytics 
  ORDER BY creator_roster_id, date_recorded DESC, created_at DESC
) latest ON cr.id = latest.creator_roster_id
GROUP BY cr.id, cr.creator_name, cr.user_id, latest.subscribers, latest.views, latest.engagement_rate;

-- Create a function to refresh YouTube data for a creator
CREATE OR REPLACE FUNCTION public.refresh_creator_youtube_data(
  p_creator_roster_id uuid,
  p_subscribers bigint DEFAULT 0,
  p_views bigint DEFAULT 0,
  p_engagement_rate numeric DEFAULT 0
) RETURNS void AS $$
BEGIN
  -- Insert or update today's data
  INSERT INTO public.youtube_analytics (
    creator_roster_id,
    subscribers,
    views,
    engagement_rate,
    date_recorded,
    fetched_at
  ) VALUES (
    p_creator_roster_id,
    p_subscribers,
    p_views,
    p_engagement_rate,
    CURRENT_DATE,
    now()
  )
  ON CONFLICT (creator_roster_id, date_recorded) 
  DO UPDATE SET
    subscribers = EXCLUDED.subscribers,
    views = EXCLUDED.views,
    engagement_rate = EXCLUDED.engagement_rate,
    fetched_at = EXCLUDED.fetched_at;
END;
$$ LANGUAGE plpgsql;