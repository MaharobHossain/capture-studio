import Dexie, { type Table } from 'dexie';
import { VideoRecord } from '@/types';

export class CaptureStudioDB extends Dexie {
  recordings!: Table<VideoRecord, string>;

  constructor() {
    super('CaptureStudioDB');
    this.version(1).stores({
      recordings: 'id, title, duration, fileSize, resolution, frameRate, format, sourceType, createdAt, updatedAt, userId, isCloudSynced',
    });
  }
}

export const db = new CaptureStudioDB();

/**
 * Generates an SVG or canvas data URL thumbnail from a video Blob.
 */
export async function generateThumbnailFromBlob(blob: Blob, seekSeconds: number = 0.5): Promise<string> {
  // If running in test / headless JSDOM environment without native video decoders, return SVG fallback immediately
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('jsdom')) {
    return getFallbackThumbnail();
  }

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(blob);
      video.src = url;

      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      video.onloadeddata = () => {
        video.currentTime = Math.min(seekSeconds, (video.duration || 1) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 640);
          canvas.height = Math.min(video.videoHeight || 360, 360);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch {
          // Canvas tainted or not ready
        }
        cleanup();
        resolve(getFallbackThumbnail());
      };

      video.onerror = () => {
        cleanup();
        resolve(getFallbackThumbnail());
      };

      // Timeout fallback in case video element doesn't seek
      setTimeout(() => {
        cleanup();
        resolve(getFallbackThumbnail());
      }, 2500);
    } catch {
      resolve(getFallbackThumbnail());
    }
  });
}

function getFallbackThumbnail(): string {
  // A clean SVG dark thumbnail with the green Capture Studio brand glyph
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="#141814"/>
    <rect x="2" y="2" width="636" height="356" fill="none" stroke="#283128" stroke-width="2"/>
    <circle cx="320" cy="180" r="48" fill="#101310" stroke="#00E632" stroke-width="3"/>
    <polygon points="312,160 338,180 312,200" fill="#00E632"/>
    <text x="320" y="260" font-family="Inter, sans-serif" font-size="16" fill="#A3ADA4" text-anchor="middle">Capture Studio Recording</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Saves a new recording to IndexedDB.
 */
export async function saveRecordingToDB(
  data: Omit<VideoRecord, 'id' | 'createdAt' | 'updatedAt' | 'thumbnailUrl'> & {
    id?: string;
    thumbnailUrl?: string;
  }
): Promise<VideoRecord> {
  const id = data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  let thumbnail = data.thumbnailUrl;
  if (!thumbnail && data.blob) {
    thumbnail = await generateThumbnailFromBlob(data.blob);
  }
  if (!thumbnail) {
    thumbnail = getFallbackThumbnail();
  }

  const record: VideoRecord = {
    ...data,
    id,
    thumbnailUrl: thumbnail,
    createdAt: now,
    updatedAt: now,
  };

  await db.recordings.put(record);
  return record;
}

/**
 * Retrieves all saved recordings from IndexedDB, ordered by createdAt desc.
 */
export async function getAllRecordingsFromDB(): Promise<VideoRecord[]> {
  try {
    return await db.recordings.orderBy('createdAt').reverse().toArray();
  } catch (err) {
    console.error('Error fetching recordings from DB:', err);
    return [];
  }
}

/**
 * Retrieves a single recording by its ID.
 */
export async function getRecordingByIdFromDB(id: string): Promise<VideoRecord | undefined> {
  try {
    return await db.recordings.get(id);
  } catch (err) {
    console.error(`Error fetching recording ${id}:`, err);
    return undefined;
  }
}

/**
 * Updates a recording record.
 */
export async function updateRecordingInDB(id: string, updates: Partial<VideoRecord>): Promise<void> {
  const existing = await db.recordings.get(id);
  if (!existing) throw new Error(`Recording ${id} not found`);

  await db.recordings.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a recording by ID.
 */
export async function deleteRecordingFromDB(id: string): Promise<void> {
  await db.recordings.delete(id);
}

/**
 * Clears all local recordings.
 */
export async function clearAllRecordingsFromDB(): Promise<void> {
  await db.recordings.clear();
}

/**
 * Calculates current IndexedDB & browser storage estimate.
 */
export async function getStorageEstimate(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  recordingsCount: number;
  percentage: number;
}> {
  const count = await db.recordings.count();
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 1024 * 1024 * 1024 * 5; // Default 5GB
      return {
        usedBytes: used,
        quotaBytes: quota,
        recordingsCount: count,
        percentage: Math.min(100, Math.round((used / quota) * 100)),
      };
    } catch {
      // Fallback
    }
  }

  // Calculate roughly from records
  const all = await db.recordings.toArray();
  const totalBytes = all.reduce((acc, r) => acc + (r.fileSize || 0), 0);
  const defaultQuota = 5 * 1024 * 1024 * 1024;
  return {
    usedBytes: totalBytes,
    quotaBytes: defaultQuota,
    recordingsCount: count,
    percentage: Math.min(100, Math.round((totalBytes / defaultQuota) * 100)),
  };
}
