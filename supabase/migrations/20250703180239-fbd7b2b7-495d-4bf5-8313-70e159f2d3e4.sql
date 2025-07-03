-- Insert sample historical data for better trend analysis (last 7 days)
-- This will help test the daily analytics table and charts

-- Insert data for Via Infinda (last 7 days with some growth)
INSERT INTO public.youtube_analytics (
  creator_roster_id, 
  channel_id, 
  channel_name, 
  channel_handle,
  subscribers, 
  views, 
  likes,
  comments,
  engagement_rate,
  date_recorded, 
  fetched_at
) VALUES 
-- Day -6
('4ff12710-3599-4f05-a3a2-8d192e6a2ab3', 'UCkIEY6rUSPy4qQjLqBBLUSg', 'Via Infinda', 'viainfinda', 2215000, 240500000, 0, 0, 0.92, '2025-06-27', NOW()),
-- Day -5
('4ff12710-3599-4f05-a3a2-8d192e6a2ab3', 'UCkIEY6rUSPy4qQjLqBBLUSg', 'Via Infinda', 'viainfinda', 2216000, 240800000, 0, 0, 0.92, '2025-06-28', NOW()),
-- Day -4
('4ff12710-3599-4f05-a3a2-8d192e6a2ab3', 'UCkIEY6rUSPy4qQjLqBBLUSg', 'Via Infinda', 'viainfinda', 2217000, 241000000, 0, 0, 0.92, '2025-06-29', NOW()),
-- Day -3
('4ff12710-3599-4f05-a3a2-8d192e6a2ab3', 'UCkIEY6rUSPy4qQjLqBBLUSg', 'Via Infinda', 'viainfinda', 2218000, 241200000, 0, 0, 0.92, '2025-06-30', NOW()),
-- Day -2
('4ff12710-3599-4f05-a3a2-8d192e6a2ab3', 'UCkIEY6rUSPy4qQjLqBBLUSg', 'Via Infinda', 'viainfinda', 2219000, 241350000, 0, 0, 0.92, '2025-07-01', NOW()),
-- Day -1
('4ff12710-3599-4f05-a3a2-8d192e6a2ab3', 'UCkIEY6rUSPy4qQjLqBBLUSg', 'Via Infinda', 'viainfinda', 2220000, 241400000, 0, 0, 0.92, '2025-07-02', NOW())

ON CONFLICT (creator_roster_id, date_recorded) DO UPDATE SET
  subscribers = EXCLUDED.subscribers,
  views = EXCLUDED.views,
  fetched_at = EXCLUDED.fetched_at;

-- Insert data for Andre Pilli (last 7 days with some growth)
INSERT INTO public.youtube_analytics (
  creator_roster_id, 
  channel_id, 
  channel_name, 
  channel_handle,
  subscribers, 
  views, 
  likes,
  comments,
  engagement_rate,
  date_recorded, 
  fetched_at
) VALUES 
-- Day -6
('904a7ed3-9be8-47e5-a764-25d705d68847', 'UCYETxCTVSpVOc1TP5KP0pMg', 'Andre Pilli', 'andrepilli', 454000, 53500000, 0, 0, 0.85, '2025-06-27', NOW()),
-- Day -5
('904a7ed3-9be8-47e5-a764-25d705d68847', 'UCYETxCTVSpVOc1TP5KP0pMg', 'Andre Pilli', 'andrepilli', 454500, 53550000, 0, 0, 0.85, '2025-06-28', NOW()),
-- Day -4
('904a7ed3-9be8-47e5-a764-25d705d68847', 'UCYETxCTVSpVOc1TP5KP0pMg', 'Andre Pilli', 'andrepilli', 455000, 53600000, 0, 0, 0.85, '2025-06-29', NOW()),
-- Day -3
('904a7ed3-9be8-47e5-a764-25d705d68847', 'UCYETxCTVSpVOc1TP5KP0pMg', 'Andre Pilli', 'andrepilli', 455200, 53620000, 0, 0, 0.85, '2025-06-30', NOW()),
-- Day -2
('904a7ed3-9be8-47e5-a764-25d705d68847', 'UCYETxCTVSpVOc1TP5KP0pMg', 'Andre Pilli', 'andrepilli', 455500, 53640000, 0, 0, 0.85, '2025-07-01', NOW()),
-- Day -1
('904a7ed3-9be8-47e5-a764-25d705d68847', 'UCYETxCTVSpVOc1TP5KP0pMg', 'Andre Pilli', 'andrepilli', 455800, 53650000, 0, 0, 0.85, '2025-07-02', NOW())

ON CONFLICT (creator_roster_id, date_recorded) DO UPDATE SET
  subscribers = EXCLUDED.subscribers,
  views = EXCLUDED.views,
  fetched_at = EXCLUDED.fetched_at;