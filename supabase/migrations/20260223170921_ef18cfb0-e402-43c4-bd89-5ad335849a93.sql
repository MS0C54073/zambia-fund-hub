
-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public) VALUES ('business-documents', 'business-documents', false);

-- Owners can upload to their own folder
CREATE POLICY "Users can upload business documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owners can view their own documents
CREATE POLICY "Users can view own business documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all business documents
CREATE POLICY "Admins can view all business documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-documents' AND public.has_role(auth.uid(), 'admin'));

-- Users can update their own documents
CREATE POLICY "Users can update own business documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own documents
CREATE POLICY "Users can delete own business documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
