-- SkillSwap Phase 6: Profiles Extension, Avatar Storage Bucket & Skills Catalog Seeding

-- 1. EXTEND PROFILES TABLE WITH METADATA COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 2. CREATE AVATARS STORAGE BUCKET (IF STORAGE SCHEMA EXISTS)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      5242880, -- 5MB limit
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  END IF;
END $$;

-- 3. STORAGE RLS POLICIES FOR AVATARS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Public read policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for Avatars'
    ) THEN
      CREATE POLICY "Public Access for Avatars"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;

    -- Authenticated upload policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload avatars'
    ) THEN
      CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    END IF;

    -- User update policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own avatars'
    ) THEN
      CREATE POLICY "Users can update their own avatars"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    END IF;

    -- User delete policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own avatars'
    ) THEN
      CREATE POLICY "Users can delete their own avatars"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    END IF;
  END IF;
END $$;

-- 4. SEED CORE CATALOG SKILLS
INSERT INTO public.skills (name, category)
VALUES
  ('UI/UX Design', 'Design'),
  ('Figma', 'Design'),
  ('Graphic Design', 'Design'),
  ('Photography', 'Design'),
  ('Python', 'Code'),
  ('React & Next.js', 'Code'),
  ('TypeScript', 'Code'),
  ('Node.js', 'Code'),
  ('Data Science', 'Code'),
  ('Digital Marketing', 'Business'),
  ('Product Strategy', 'Business'),
  ('Public Speaking', 'Business'),
  ('Financial Modeling', 'Business'),
  ('Spanish', 'Language'),
  ('French', 'Language'),
  ('English', 'Language'),
  ('Acoustic Guitar', 'Music'),
  ('Music Production', 'Music'),
  ('Content Writing', 'Other')
ON CONFLICT (name) DO NOTHING;
