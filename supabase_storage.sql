-- Create the 'review' bucket as public (required for /public/ URLs to work)
insert into storage.buckets (id, name, public)
values ('review', 'review', true)
on conflict (id) do update set public = true;

-- Allow public read access to files in 'review' bucket
create policy "Allow public read access to review"
  on storage.objects for select
  using (bucket_id = 'review');

-- Allow authenticated users to upload files to 'review' bucket
create policy "Allow authenticated upload of review"
  on storage.objects for insert
  with check (
    bucket_id = 'review' 
    and auth.role() = 'authenticated'
  );

-- Allow authenticated owners to manage files in 'review' bucket
create policy "Allow owners control of review"
  on storage.objects for all
  using (
    bucket_id = 'review'
    and auth.role() = 'authenticated'
  );


-- ==========================================
-- POLICIES FOR THE 'logos' BUCKET (FALLBACK)
-- ==========================================

-- Create the 'logos' storage bucket if fallback is used
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Allow public read access to logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Allow authenticated upload of logos"
  on storage.objects for insert
  with check (
    bucket_id = 'logos' 
    and auth.role() = 'authenticated'
  );

create policy "Allow owners control of their logos"
  on storage.objects for all
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );
