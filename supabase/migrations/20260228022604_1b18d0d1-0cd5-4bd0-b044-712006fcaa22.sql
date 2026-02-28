-- Enable realtime for campaigns table so investors see live funding updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;