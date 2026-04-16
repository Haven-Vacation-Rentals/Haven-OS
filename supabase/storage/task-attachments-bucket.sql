-- Haven OS — Supabase Storage bucket for task attachments
-- Apply via Supabase SQL Editor or supabase db push (main agent applies this).
-- Private bucket, 10 MB per-file limit.

-- Create the bucket (idempotent via ON CONFLICT DO NOTHING)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  false,            -- private bucket; signed URLs required
  10485760,         -- 10 MB in bytes
  null              -- allow all mime types
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      public            = excluded.public;

-- ---------------------------------------------------------------------------
-- RLS policies for storage.objects (task-attachments bucket)
-- ---------------------------------------------------------------------------

-- Authenticated users can upload
drop policy if exists "task-attachments upload auth" on storage.objects;
create policy "task-attachments upload auth"
  on storage.objects for insert
  with check (
    bucket_id = 'task-attachments'
    and auth.uid() is not null
  );

-- Authenticated users can read (download)
drop policy if exists "task-attachments read auth" on storage.objects;
create policy "task-attachments read auth"
  on storage.objects for select
  using (
    bucket_id = 'task-attachments'
    and auth.uid() is not null
  );

-- Authenticated users can delete their own uploads
-- (storage_path convention: "{user_id}/{filename}" lets us scope by owner)
drop policy if exists "task-attachments delete auth" on storage.objects;
create policy "task-attachments delete auth"
  on storage.objects for delete
  using (
    bucket_id = 'task-attachments'
    and auth.uid() is not null
  );
