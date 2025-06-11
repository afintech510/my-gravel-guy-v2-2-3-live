
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-uploads', 'customer-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets SET public = true WHERE id = 'customer-uploads';

-- Create policy to allow anyone to upload files to customer-uploads bucket
CREATE POLICY "Allow public uploads to customer-uploads" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'customer-uploads');

-- Create policy to allow anyone to read files from customer-uploads bucket
CREATE POLICY "Allow public reads from customer-uploads" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'customer-uploads');

-- Optional: Create policy to allow users to delete their own uploads (if needed later)
CREATE POLICY "Allow public deletes from customer-uploads" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'customer-uploads');
