
-- Create a table to store creator roster with social media links
CREATE TABLE public.creator_roster (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creator_name TEXT NOT NULL,
  channel_links JSONB DEFAULT '{}',
  social_media_handles JSONB DEFAULT '{}',
  channel_stats JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.creator_roster ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_roster
CREATE POLICY "Users can manage their own roster" 
  ON public.creator_roster 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create a table to store roster analytics data
CREATE TABLE public.roster_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roster_id UUID NOT NULL REFERENCES public.creator_roster(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'subscribers', 'views', 'videos', etc.
  metric_value BIGINT DEFAULT 0,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS to roster_analytics
ALTER TABLE public.roster_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for roster_analytics
CREATE POLICY "Users can view roster analytics for their creators" 
  ON public.roster_analytics 
  FOR SELECT 
  USING (
    EXISTS(
      SELECT 1 FROM public.creator_roster cr 
      WHERE cr.id = roster_analytics.roster_id 
      AND cr.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert roster analytics" 
  ON public.roster_analytics 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update roster analytics" 
  ON public.roster_analytics 
  FOR UPDATE 
  USING (true);
