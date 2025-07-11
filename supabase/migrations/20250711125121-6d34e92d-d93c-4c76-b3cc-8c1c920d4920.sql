-- Create a function to get properly aggregated daily analytics for the roster dashboard
CREATE OR REPLACE FUNCTION get_roster_daily_analytics(
  p_creator_ids UUID[] DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  date_recorded DATE,
  total_daily_views BIGINT,
  total_daily_subscribers BIGINT,
  total_daily_engagement BIGINT,
  creator_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ya.date_recorded,
    COALESCE(SUM(ya.daily_views), 0) as total_daily_views,
    COALESCE(SUM(ya.daily_subscribers), 0) as total_daily_subscribers, 
    COALESCE(SUM(ya.daily_likes + ya.daily_comments), 0) as total_daily_engagement,
    COUNT(DISTINCT ya.creator_roster_id) as creator_count
  FROM youtube_analytics ya
  JOIN creator_roster cr ON ya.creator_roster_id = cr.id
  WHERE 
    ya.date_recorded >= p_start_date
    AND ya.date_recorded <= p_end_date
    AND (p_creator_ids IS NULL OR ya.creator_roster_id = ANY(p_creator_ids))
    AND ya.daily_views IS NOT NULL -- Ensure we have daily metrics
  GROUP BY ya.date_recorded
  ORDER BY ya.date_recorded DESC;
END;
$$;