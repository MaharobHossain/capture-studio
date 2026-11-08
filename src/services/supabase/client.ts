import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Uploads a video blob to Supabase Storage if configured.
 * Bucket name: "recordings"
 */
export async function uploadRecordingToCloud(
  blob: Blob,
  userId: string,
  fileName: string
): Promise<{ path: string; publicUrl?: string } | null> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please add your credentials in .env');
  }

  const filePath = `${userId}/${Date.now()}_${fileName}`;
  const { error } = await supabase.storage
    .from('recordings')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('recordings')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData?.publicUrl,
  };
}
