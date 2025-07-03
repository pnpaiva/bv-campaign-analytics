
-- Add a table to store real-time analytics data for creators
CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_roster_id UUID NOT NULL REFERENCES public.creator_roster(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'views', 'subscribers', 'engagement', 'watch_time'
  metric_value BIGINT NOT NULL DEFAULT 0,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for creator_analytics
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view analytics for their own creators
CREATE POLICY "Users can view their creator analytics" 
  ON public.creator_analytics 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.creator_roster cr 
    WHERE cr.id = creator_analytics.creator_roster_id 
    AND cr.user_id = auth.uid()
  ));

-- System can insert/update analytics data
CREATE POLICY "System can manage creator analytics" 
  ON public.creator_analytics 
  FOR ALL 
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_creator_analytics_roster_platform 
  ON public.creator_analytics(creator_roster_id, platform);

CREATE INDEX IF NOT EXISTS idx_creator_analytics_fetched_at 
  ON public.creator_analytics(fetched_at DESC);
