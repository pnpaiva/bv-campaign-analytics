
-- Update the get_dashboard_metrics function to accept master_campaigns parameter
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  start_date date DEFAULT NULL::date, 
  end_date date DEFAULT NULL::date, 
  creator_ids uuid[] DEFAULT NULL::uuid[], 
  client_ids uuid[] DEFAULT NULL::uuid[], 
  campaign_ids uuid[] DEFAULT NULL::uuid[], 
  platforms text[] DEFAULT NULL::text[],
  master_campaigns text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  total_campaigns bigint, 
  total_views bigint, 
  total_engagement bigint, 
  avg_engagement_rate numeric, 
  total_deal_value numeric, 
  platform_breakdown jsonb, 
  creator_performance jsonb, 
  monthly_trends jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  filtered_campaigns bigint;
  filtered_views bigint;
  filtered_engagement bigint;
  filtered_deal_value numeric;
  calculated_engagement_rate numeric;
  platforms_json jsonb;
  creators_json jsonb;
  monthly_json jsonb;
BEGIN
  -- Get basic metrics first
  SELECT 
    COUNT(DISTINCT da.campaign_id),
    COALESCE(SUM(da.views), 0),
    COALESCE(SUM(da.engagement), 0),
    COALESCE(SUM(DISTINCT da.deal_value), 0)
  INTO 
    filtered_campaigns,
    filtered_views,
    filtered_engagement,
    filtered_deal_value
  FROM dashboard_analytics da
  WHERE 
    (start_date IS NULL OR da.campaign_date >= start_date)
    AND (end_date IS NULL OR da.campaign_date <= end_date)
    AND (creator_ids IS NULL OR da.creator_id = ANY(creator_ids))
    AND (client_ids IS NULL OR da.client_id = ANY(client_ids))
    AND (campaign_ids IS NULL OR da.campaign_id = ANY(campaign_ids))
    AND (platforms IS NULL OR da.platform = ANY(platforms))
    AND (master_campaigns IS NULL OR 
         EXISTS(SELECT 1 FROM campaigns c WHERE c.id = da.campaign_id AND c.master_campaign_name = ANY(master_campaigns)));

  -- Calculate engagement rate
  IF filtered_views > 0 THEN
    calculated_engagement_rate := (filtered_engagement::numeric / filtered_views) * 100;
  ELSE
    calculated_engagement_rate := 0;
  END IF;

  -- Get platform breakdown
  SELECT COALESCE(jsonb_object_agg(
    COALESCE(platform, 'unknown'),
    jsonb_build_object(
      'views', platform_views,
      'engagement', platform_engagement,
      'campaigns', platform_campaigns
    )
  ), '{}'::jsonb)
  INTO platforms_json
  FROM (
    SELECT 
      da.platform,
      COALESCE(SUM(da.views), 0) as platform_views,
      COALESCE(SUM(da.engagement), 0) as platform_engagement,
      COUNT(DISTINCT da.campaign_id) as platform_campaigns
    FROM dashboard_analytics da
    WHERE 
      (start_date IS NULL OR da.campaign_date >= start_date)
      AND (end_date IS NULL OR da.campaign_date <= end_date)
      AND (creator_ids IS NULL OR da.creator_id = ANY(creator_ids))
      AND (client_ids IS NULL OR da.client_id = ANY(client_ids))
      AND (campaign_ids IS NULL OR da.campaign_id = ANY(campaign_ids))
      AND (platforms IS NULL OR da.platform = ANY(platforms))
      AND (master_campaigns IS NULL OR 
           EXISTS(SELECT 1 FROM campaigns c WHERE c.id = da.campaign_id AND c.master_campaign_name = ANY(master_campaigns)))
      AND da.platform IS NOT NULL
    GROUP BY da.platform
  ) platform_stats;

  -- Get creator performance
  SELECT COALESCE(jsonb_object_agg(
    creator_name,
    jsonb_build_object(
      'views', creator_views,
      'engagement', creator_engagement,
      'campaigns', creator_campaigns,
      'avg_engagement_rate', creator_rate
    )
  ), '{}'::jsonb)
  INTO creators_json
  FROM (
    SELECT 
      da.creator_name,
      COALESCE(SUM(da.views), 0) as creator_views,
      COALESCE(SUM(da.engagement), 0) as creator_engagement,
      COUNT(DISTINCT da.campaign_id) as creator_campaigns,
      CASE 
        WHEN SUM(da.views) > 0 
        THEN (SUM(da.engagement)::numeric / SUM(da.views)) * 100
        ELSE 0 
      END as creator_rate
    FROM dashboard_analytics da
    WHERE 
      (start_date IS NULL OR da.campaign_date >= start_date)
      AND (end_date IS NULL OR da.campaign_date <= end_date)
      AND (creator_ids IS NULL OR da.creator_id = ANY(creator_ids))
      AND (client_ids IS NULL OR da.client_id = ANY(client_ids))
      AND (campaign_ids IS NULL OR da.campaign_id = ANY(campaign_ids))
      AND (platforms IS NULL OR da.platform = ANY(platforms))
      AND (master_campaigns IS NULL OR 
           EXISTS(SELECT 1 FROM campaigns c WHERE c.id = da.campaign_id AND c.master_campaign_name = ANY(master_campaigns)))
      AND da.creator_name IS NOT NULL
    GROUP BY da.creator_name
  ) creator_stats;

  -- Get monthly trends
  SELECT COALESCE(jsonb_object_agg(
    month_key,
    jsonb_build_object(
      'views', monthly_views,
      'engagement', monthly_engagement,
      'campaigns', monthly_campaigns
    )
  ), '{}'::jsonb)
  INTO monthly_json
  FROM (
    SELECT 
      TO_CHAR(da.campaign_date, 'YYYY-MM') as month_key,
      COALESCE(SUM(da.views), 0) as monthly_views,
      COALESCE(SUM(da.engagement), 0) as monthly_engagement,
      COUNT(DISTINCT da.campaign_id) as monthly_campaigns
    FROM dashboard_analytics da
    WHERE 
      (start_date IS NULL OR da.campaign_date >= start_date)
      AND (end_date IS NULL OR da.campaign_date <= end_date)
      AND (creator_ids IS NULL OR da.creator_id = ANY(creator_ids))
      AND (client_ids IS NULL OR da.client_id = ANY(client_ids))
      AND (campaign_ids IS NULL OR da.campaign_id = ANY(campaign_ids))
      AND (platforms IS NULL OR da.platform = ANY(platforms))
      AND (master_campaigns IS NULL OR 
           EXISTS(SELECT 1 FROM campaigns c WHERE c.id = da.campaign_id AND c.master_campaign_name = ANY(master_campaigns)))
      AND da.campaign_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', da.campaign_date), TO_CHAR(da.campaign_date, 'YYYY-MM')
    ORDER BY DATE_TRUNC('month', da.campaign_date)
  ) monthly_stats;

  -- Return the results
  RETURN QUERY SELECT 
    filtered_campaigns,
    filtered_views,
    filtered_engagement,
    calculated_engagement_rate,
    filtered_deal_value,
    COALESCE(platforms_json, '{}'::jsonb),
    COALESCE(creators_json, '{}'::jsonb),
    COALESCE(monthly_json, '{}'::jsonb);
END;
$function$;
