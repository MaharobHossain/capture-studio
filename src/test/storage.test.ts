import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveRecordingToDB,
  getAllRecordingsFromDB,
  getRecordingByIdFromDB,
  updateRecordingInDB,
  deleteRecordingFromDB,
  clearAllRecordingsFromDB,
  getStorageEstimate,
} from '@/services/storage/db';

describe('Local Video Storage System (IndexedDB)', () => {
  beforeEach(async () => {
    await clearAllRecordingsFromDB();
  });

  it('saves a guest recording without requiring authentication', async () => {
    const mockBlob = new Blob(['sample video data'], { type: 'video/webm' });
    const saved = await saveRecordingToDB({
      title: 'Test Screen Recording 1',
      blob: mockBlob,
      duration: 45,
      fileSize: 1024 * 500,
      resolution: '1080p Full HD',
      frameRate: 30,
      format: 'webm',
      sourceType: 'screen',
    });

    expect(saved.id).toBeDefined();
    expect(saved.title).toBe('Test Screen Recording 1');
    expect(saved.duration).toBe(45);
    expect(saved.thumbnailUrl).toBeDefined();
    expect(saved.createdAt).toBeDefined();
  });

  it('retrieves all saved recordings ordered by createdAt descending', async () => {
    const blob1 = new Blob(['data1'], { type: 'video/webm' });
    const blob2 = new Blob(['data2'], { type: 'video/webm' });

    await saveRecordingToDB({
      title: 'First Recording',
      blob: blob1,
      duration: 10,
      fileSize: 100,
      resolution: '720p',
      frameRate: 30,
      format: 'webm',
      sourceType: 'screen',
    });

    await new Promise((r) => setTimeout(r, 20));

    await saveRecordingToDB({
      title: 'Second Recording',
      blob: blob2,
      duration: 20,
      fileSize: 200,
      resolution: '1080p',
      frameRate: 60,
      format: 'webm',
      sourceType: 'camera',
    });

    const list = await getAllRecordingsFromDB();
    expect(list.length).toBe(2);
    expect(list[0].title).toBe('Second Recording');
  });

  it('allows renaming a saved recording', async () => {
    const blob = new Blob(['video data'], { type: 'video/webm' });
    const saved = await saveRecordingToDB({
      title: 'Old Title',
      blob,
      duration: 15,
      fileSize: 1000,
      resolution: '1080p',
      frameRate: 30,
      format: 'webm',
      sourceType: 'screen-camera',
    });

    await updateRecordingInDB(saved.id, { title: 'Renamed Title' });
    const updated = await getRecordingByIdFromDB(saved.id);
    expect(updated?.title).toBe('Renamed Title');
  });

  it('deletes a recording permanently by id', async () => {
    const blob = new Blob(['video data'], { type: 'video/webm' });
    const saved = await saveRecordingToDB({
      title: 'To Be Deleted',
      blob,
      duration: 5,
      fileSize: 500,
      resolution: '720p',
      frameRate: 30,
      format: 'webm',
      sourceType: 'screen',
    });

    await deleteRecordingFromDB(saved.id);
    const result = await getRecordingByIdFromDB(saved.id);
    expect(result).toBeUndefined();
  });

  it('calculates storage estimates properly', async () => {
    const blob = new Blob(['test storage data'], { type: 'video/webm' });
    await saveRecordingToDB({
      title: 'Storage Test Video',
      blob,
      duration: 30,
      fileSize: 5000,
      resolution: '1080p',
      frameRate: 30,
      format: 'webm',
      sourceType: 'screen',
    });

    const estimate = await getStorageEstimate();
    expect(estimate.recordingsCount).toBe(1);
    expect(estimate.quotaBytes).toBeGreaterThan(0);
  });
});
