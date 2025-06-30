
-- Create a comprehensive analytics view that combines campaign and analytics data
CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT 
  c.id as campaign_id,
  c.brand_name,
  c.creator_id,
  c.campaign_date,
  c.campaign_month,
  c.client_id,
  c.client_name,
  c.deal_value,
  c.status,
  c.total_views as campaign_total_views,
  c.total_engagement as campaign_total_engagement,
  c.engagement_rate as campaign_engagement_rate,
  cr.name as creator_name,
  cr.platform_handles,
  cl.name as client_name_full,
  ad.id as analytics_id,
  ad.platform,
  ad.content_url,
  ad.views,
  ad.engagement,
  ad.likes,
  ad.comments,
  ad.shares,
  ad.engagement_rate as content_engagement_rate,
  ad.sentiment_score,
  ad.sentiment_label,
  ad.fetched_at
FROM campaigns c
LEFT JOIN creators cr ON c.creator_id = cr.id
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN analytics_data ad ON c.id = ad.campaign_id
WHERE c.user_id = auth.uid();

-- Create indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_date ON campaigns(user_id, campaign_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_platform ON analytics_data(campaign_id, platform);

-- Function to get dashboard metrics with filters
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  creator_ids uuid[] DEFAULT NULL,
  client_ids uuid[] DEFAULT NULL,
  campaign_ids uuid[] DEFAULT NULL,
  platforms text[] DEFAULT NULL
)
RETURNS TABLE (
  total_campaigns bigint,
  total_views bigint,
  total_engagement bigint,
  avg_engagement_rate numeric,
  total_deal_value numeric,
  platform_breakdown jsonb,
  creator_performance jsonb,
  monthly_trends jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT *
    FROM dashboard_analytics da
    WHERE 
      (start_date IS NULL OR da.campaign_date >= start_date)
      AND (end_date IS NULL OR da.campaign_date <= end_date)
      AND (creator_ids IS NULL OR da.creator_id = ANY(creator_ids))
      AND (client_ids IS NULL OR da.client_id = ANY(client_ids))
      AND (campaign_ids IS NULL OR da.campaign_id = ANY(campaign_ids))
      AND (platforms IS NULL OR da.platform = ANY(platforms))
  ),
  metrics AS (
    SELECT 
      COUNT(DISTINCT campaign_id) as campaign_count,
      COALESCE(SUM(views), 0) as total_views_sum,
      COALESCE(SUM(engagement), 0) as total_engagement_sum,
      COALESCE(AVG(content_engagement_rate), 0) as avg_engagement,
      COALESCE(SUM(DISTINCT deal_value), 0) as deal_value_sum
    FROM filtered_data
  ),
  platform_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(platform, 'unknown'),
      jsonb_build_object(
        'views', COALESCE(SUM(views), 0),
        'engagement', COALESCE(SUM(engagement), 0),
        'campaigns', COUNT(DISTINCT campaign_id)
      )
    ) as platform_data
    FROM filtered_data
    WHERE platform IS NOT NULL
    GROUP BY platform
  ),
  creator_stats AS (
    SELECT jsonb_object_agg(
      creator_name,
      jsonb_build_object(
        'views', COALESCE(SUM(views), 0),
        'engagement', COALESCE(SUM(engagement), 0),
        'campaigns', COUNT(DISTINCT campaign_id),
        'avg_engagement_rate', COALESCE(AVG(content_engagement_rate), 0)
      )
    ) as creator_data
    FROM filtered_data
    WHERE creator_name IS NOT NULL
    GROUP BY creator_name
  ),
  monthly_data AS (
    SELECT jsonb_object_agg(
      TO_CHAR(campaign_date, 'YYYY-MM'),
      jsonb_build_object(
        'views', COALESCE(SUM(views), 0),
        'engagement', COALESCE(SUM(engagement), 0),
        'campaigns', COUNT(DISTINCT campaign_id)
      )
    ) as monthly_data
    FROM filtered_data
    WHERE campaign_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', campaign_date)
    ORDER BY DATE_TRUNC('month', campaign_date)
  )
  SELECT 
    m.campaign_count,
    m.total_views_sum,
    m.total_engagement_sum,
    m.avg_engagement,
    m.deal_value_sum,
    COALESCE(ps.platform_data, '{}'::jsonb),
    COALESCE(cs.creator_data, '{}'::jsonb),
    COALESCE(md.monthly_data, '{}'::jsonb)
  FROM metrics m
  CROSS JOIN platform_stats ps
  CROSS JOIN creator_stats cs
  CROSS JOIN monthly_data md;
END;
$$;

-- Function to get campaign performance over time for charts
CREATE OR REPLACE FUNCTION get_campaign_trends(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  group_by_period text DEFAULT 'month' -- 'day', 'week', 'month'
)
RETURNS TABLE (
  period text,
  total_views bigint,
  total_engagement bigint,
  campaign_count bigint,
  avg_engagement_rate numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  date_trunc_format text;
BEGIN
  -- Set the date truncation format based on grouping period
  CASE group_by_period
    WHEN 'day' THEN date_trunc_format := 'day';
    WHEN 'week' THEN date_trunc_format := 'week';
    ELSE date_trunc_format := 'month';
  END CASE;

  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC(date_trunc_format, da.campaign_date), 'YYYY-MM-DD') as period,
    COALESCE(SUM(da.views), 0) as total_views,
    COALESCE(SUM(da.engagement), 0) as total_engagement,
    COUNT(DISTINCT da.campaign_id) as campaign_count,
    COALESCE(AVG(da.content_engagement_rate), 0) as avg_engagement_rate
  FROM dashboard_analytics da
  WHERE 
    (start_date IS NULL OR da.campaign_date >= start_date)
    AND (end_date IS NULL OR da.campaign_date <= end_date)
    AND da.campaign_date IS NOT NULL
  GROUP BY DATE_TRUNC(date_trunc_format, da.campaign_date)
  ORDER BY DATE_TRUNC(date_trunc_format, da.campaign_date);
END;
$$;

-- Function to get top performing content
CREATE OR REPLACE FUNCTION get_top_content(
  limit_count integer DEFAULT 10,
  order_by text DEFAULT 'views' -- 'views', 'engagement', 'engagement_rate'
)
RETURNS TABLE (
  campaign_id uuid,
  brand_name text,
  creator_name text,
  platform text,
  content_url text,
  views integer,
  engagement integer,
  engagement_rate numeric,
  campaign_date date
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  order_clause text;
BEGIN
  -- Set the order clause based on the order_by parameter
  CASE order_by
    WHEN 'engagement' THEN order_clause := 'da.engagement DESC NULLS LAST';
    WHEN 'engagement_rate' THEN order_clause := 'da.content_engagement_rate DESC NULLS LAST';
    ELSE order_clause := 'da.views DESC NULLS LAST';
  END CASE;

  RETURN QUERY EXECUTE format('
    SELECT 
      da.campaign_id,
      da.brand_name,
      da.creator_name,
      da.platform,
      da.content_url,
      da.views,
      da.engagement,
      da.content_engagement_rate,
      da.campaign_date
    FROM dashboard_analytics da
    WHERE da.content_url IS NOT NULL
    ORDER BY %s
    LIMIT %s
  ', order_clause, limit_count);
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON dashboard_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_content TO authenticated;

-- Refresh the campaign totals for all existing campaigns to ensure data consistency
DO $$
DECLARE
    campaign_record RECORD;
BEGIN
    FOR campaign_record IN SELECT id FROM campaigns LOOP
        PERFORM update_campaign_totals(campaign_record.id);
    END LOOP;
END $$;
