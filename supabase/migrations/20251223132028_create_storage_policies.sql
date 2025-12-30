/*
  # Storage Bucket Policies for Resumes

  ## Overview
  This migration creates storage policies for the resumes bucket to allow
  users to upload and view resume PDFs.

  ## Security
  - Allow public upload to resumes bucket
  - Allow public read access to resumes bucket
  - Policies are permissive for demo purposes (can be restricted in production)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can upload resumes'
  ) THEN
    CREATE POLICY "Anyone can upload resumes"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'resumes');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view resumes'
  ) THEN
    CREATE POLICY "Anyone can view resumes"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'resumes');
  END IF;
END $$;