
-- Fix the get_dashboard_metrics function to avoid nested aggregate functions
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
      COALESCE(SUM(DISTINCT deal_value), 0) as deal_value_sum
    FROM filtered_data
  ),
  engagement_rate_calc AS (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 AND SUM(views) > 0 
        THEN (SUM(engagement)::numeric / SUM(views)) * 100
        ELSE 0 
      END as avg_engagement
    FROM filtered_data
    WHERE content_engagement_rate IS NOT NULL
  ),
  platform_stats AS (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 
        THEN jsonb_object_agg(
          COALESCE(platform, 'unknown'),
          jsonb_build_object(
            'views', COALESCE(SUM(views), 0),
            'engagement', COALESCE(SUM(engagement), 0),
            'campaigns', COUNT(DISTINCT campaign_id)
          )
        )
        ELSE '{}'::jsonb
      END as platform_data
    FROM filtered_data
    WHERE platform IS NOT NULL
    GROUP BY platform
  ),
  creator_stats AS (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 
        THEN jsonb_object_agg(
          creator_name,
          jsonb_build_object(
            'views', COALESCE(SUM(views), 0),
            'engagement', COALESCE(SUM(engagement), 0),
            'campaigns', COUNT(DISTINCT campaign_id),
            'avg_engagement_rate', CASE 
              WHEN SUM(views) > 0 
              THEN (SUM(engagement)::numeric / SUM(views)) * 100
              ELSE 0 
            END
          )
        )
        ELSE '{}'::jsonb
      END as creator_data
    FROM filtered_data
    WHERE creator_name IS NOT NULL
    GROUP BY creator_name
  ),
  monthly_data AS (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 
        THEN jsonb_object_agg(
          TO_CHAR(campaign_date, 'YYYY-MM'),
          jsonb_build_object(
            'views', COALESCE(SUM(views), 0),
            'engagement', COALESCE(SUM(engagement), 0),
            'campaigns', COUNT(DISTINCT campaign_id)
          )
        )
        ELSE '{}'::jsonb
      END as monthly_data
    FROM filtered_data
    WHERE campaign_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', campaign_date)
  )
  SELECT 
    m.campaign_count,
    m.total_views_sum,
    m.total_engagement_sum,
    e.avg_engagement,
    m.deal_value_sum,
    COALESCE(ps.platform_data, '{}'::jsonb),
    COALESCE(cs.creator_data, '{}'::jsonb),
    COALESCE(md.monthly_data, '{}'::jsonb)
  FROM metrics m
  CROSS JOIN engagement_rate_calc e
  CROSS JOIN platform_stats ps
  CROSS JOIN creator_stats cs
  CROSS JOIN monthly_data md;
END;
$$;
