
-- =====================================================
-- PHASE 3: ENHANCED STORAGE POLICIES
-- Restrict storage with authentication and file limits
-- =====================================================

-- First, ensure the customer-uploads bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'customer-uploads', 
  'customer-uploads', 
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Allow public uploads to customer-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from customer-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from customer-uploads" ON storage.objects;

-- =====================================================
-- UPLOAD POLICIES - Authenticated users only with limits
-- =====================================================

-- Policy: Only authenticated users can upload files
CREATE POLICY "authenticated_uploads_only" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'customer-uploads' AND
    auth.uid() IS NOT NULL AND
    -- Organize by user ID in path structure
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- READ POLICIES - Public read but organized by user
-- =====================================================

-- Policy: Public can read files (for customer photos in orders)
CREATE POLICY "public_read_customer_uploads" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'customer-uploads');

-- =====================================================
-- DELETE POLICIES - Only file owner or admin
-- =====================================================

-- Policy: Users can delete their own files
CREATE POLICY "users_delete_own_files" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'customer-uploads' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can delete any file
CREATE POLICY "admins_delete_any_file" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'customer-uploads' AND
    public.is_admin_with_role('admin')
  );

-- =====================================================
-- UPDATE POLICIES - Only file owner or admin
-- =====================================================

-- Policy: Users can update their own files
CREATE POLICY "users_update_own_files" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'customer-uploads' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can update any file
CREATE POLICY "admins_update_any_file" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'customer-uploads' AND
    public.is_admin_with_role('admin')
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to verify storage policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Query to verify bucket settings
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'customer-uploads';
