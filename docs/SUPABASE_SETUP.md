# Capture Studio - Supabase Setup Guide

## Overview

Supabase is used to provide **optional** cloud synchronization and authentication for users who want to back up their videos or access recordings across devices.

> **Crucial Rule**: The entire application (recording, offline IndexedDB storage, editing, downloading) remains 100% operational in **Guest Mode** without Supabase.

---

## 1. Create a Supabase Project

1. Log in to [Supabase](https://supabase.com/).
2. Create a new project (e.g. `capture-studio`).
3. Note your **Project URL** and **Anon Key** from Project Settings > API.

---

## 2. Configure Environment Variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 3. Run Database Migrations

Open the **SQL Editor** in your Supabase dashboard and run the schema file located at:

[`supabase/migrations/20260101000000_init.sql`](../supabase/migrations/20260101000000_init.sql)

This will create:
- `profiles` table with RLS
- `recordings` metadata table with RLS
- `user_settings` table with RLS

---

## 4. Setup Storage Bucket

1. In Supabase Dashboard, go to **Storage > New Bucket**.
2. Name the bucket `recordings`.
3. Set **Public Bucket** to `false` (Private).
4. Run the storage RLS policy in the SQL editor:

```sql
CREATE POLICY "Users can upload their own recordings" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own recordings" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own recordings" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
```

