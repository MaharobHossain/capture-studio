# Capture Studio - Database Schema & Data Models

## Schema Diagrams & Tables

### 1. `profiles` Table
Stores optional user profile information linked to Supabase Auth (`auth.users`).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | Auth User ID |
| `display_name` | TEXT | NULLABLE | User chosen display name |
| `avatar_url` | TEXT | NULLABLE | User profile picture URL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation date |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update date |

### 2. `recordings` Table
Stores synchronized recording metadata.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique recording ID (rec_...) |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) | Owner ID |
| `title` | TEXT | NOT NULL | Video title |
| `storage_path` | TEXT | NULLABLE | Path inside `recordings` bucket |
| `duration` | NUMERIC | NOT NULL, DEFAULT 0 | Duration in seconds |
| `file_size` | BIGINT | NOT NULL, DEFAULT 0 | File size in bytes |
| `resolution` | TEXT | NOT NULL, DEFAULT '1080p' | Video resolution |
| `format` | TEXT | NOT NULL, DEFAULT 'webm' | Container format |
| `source_type` | TEXT | NOT NULL, DEFAULT 'screen' | Screen, screen-camera, camera |
| `thumbnail_path` | TEXT | NULLABLE | Path to preview thumbnail |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Update timestamp |

### 3. `user_settings` Table
Stores synchronized preferences across devices.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Record ID |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES auth.users(id) | User ID |
| `default_resolution` | TEXT | NOT NULL, DEFAULT '1080p' | Preferred resolution |
| `default_fps` | INTEGER | NOT NULL, DEFAULT 30 | Preferred frame rate |
| `default_format` | TEXT | NOT NULL, DEFAULT 'webm' | Preferred format |
| `default_mic_enabled` | BOOLEAN | NOT NULL, DEFAULT true | Microphone on by default |
| `default_system_audio_enabled` | BOOLEAN | NOT NULL, DEFAULT true | System audio on by default |
| `default_camera_enabled` | BOOLEAN | NOT NULL, DEFAULT false | Camera overlay on by default |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

---

## Row Level Security (RLS)

All tables strictly enforce RLS policies restricting operations to the authenticated owner (`auth.uid() = user_id`). No public read or write access is allowed.
