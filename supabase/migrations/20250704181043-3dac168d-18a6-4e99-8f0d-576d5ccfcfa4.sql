
-- Create video_analytics table for individual video tracking
CREATE TABLE public.video_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_roster_id UUID NOT NULL REFERENCES public.creator_roster(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  duration TEXT,
  thumbnail_url TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_roster_id, video_id)
);

-- Enable RLS for video_analytics
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for video_analytics
CREATE POLICY "Users can view their video analytics" 
  ON public.video_analytics 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.creator_roster cr 
    WHERE cr.id = video_analytics.creator_roster_id 
    AND cr.user_id = auth.uid()
  ));

CREATE POLICY "System can manage video analytics" 
  ON public.video_analytics 
  FOR ALL 
  USING (true);

-- Create index for efficient queries
CREATE INDEX idx_video_analytics_creator_published ON public.video_analytics(creator_roster_id, published_at DESC);
CREATE INDEX idx_video_analytics_published_date ON public.video_analytics(DATE(published_at));

-- Create function to get daily video performance
CREATE OR REPLACE FUNCTION public.get_daily_video_performance(
  p_creator_roster_ids UUID[],
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date_recorded DATE,
  creator_roster_id UUID,
  creator_name TEXT,
  daily_views BIGINT,
  daily_engagement BIGINT,
  videos_published BIGINT,
  total_subscribers BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(va.published_at) as date_recorded,
    va.creator_roster_id,
    cr.creator_name,
    COALESCE(SUM(va.views), 0) as daily_views,
    COALESCE(SUM(va.likes + va.comments), 0) as daily_engagement,
    COUNT(va.id) as videos_published,
    COALESCE(MAX(ya.subscribers), 0) as total_subscribers
  FROM public.video_analytics va
  JOIN public.creator_roster cr ON cr.id = va.creator_roster_id
  LEFT JOIN public.youtube_analytics ya ON ya.creator_roster_id = va.creator_roster_id 
    AND ya.date_recorded = DATE(va.published_at)
  WHERE 
    (p_creator_roster_ids IS NULL OR va.creator_roster_id = ANY(p_creator_roster_ids))
    AND (p_start_date IS NULL OR DATE(va.published_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(va.published_at) <= p_end_date)
  GROUP BY DATE(va.published_at), va.creator_roster_id, cr.creator_name
  ORDER BY DATE(va.published_at) DESC, cr.creator_name;
END;
$$;
