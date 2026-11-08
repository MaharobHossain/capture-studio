import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Library,
  Search,
  ArrowUpDown,
  Plus,
  HardDrive,
  Film,
  Sparkles,
} from 'lucide-react';
import { VideoRecord } from '@/types';
import {
  getAllRecordingsFromDB,
  deleteRecordingFromDB,
  updateRecordingInDB,
} from '@/services/storage/db';
import { VideoCard } from '@/components/videos/VideoCard';
import { Button } from '@/components/common/Button';
import { useSettingsStore } from '@/store/useSettingsStore';

type SortOption = 'date-desc' | 'date-asc' | 'size-desc' | 'duration-desc' | 'name-asc';

export const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const { storageUsage, refreshStorageUsage } = useSettingsStore();

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const records = await getAllRecordingsFromDB();
      setVideos(records);
      await refreshStorageUsage();
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteRecordingFromDB(id);
    await loadVideos();
  };

  const handleRename = async (id: string, newTitle: string) => {
    await updateRecordingInDB(id, { title: newTitle });
    await loadVideos();
  };

  // Filter and sort videos
  const filteredVideos = videos
    .filter((v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'size-desc':
          return b.fileSize - a.fileSize;
        case 'duration-desc':
          return b.duration - a.duration;
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'date-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-brand tracking-wider uppercase font-mono">
              Local Library
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Saved Videos
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            All your captured videos saved offline in browser IndexedDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              New Recording
            </Button>
          </Link>
        </div>
      </div>

      {/* Storage & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recordings by title..."
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Sort Select */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-field pl-10 text-sm cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="size-desc">Largest File Size</option>
            <option value="duration-desc">Longest Duration</option>
            <option value="name-asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Videos List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-card border border-border rounded-2xl p-4 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-surface-card/40 border border-border rounded-2xl max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-secondary border border-border flex items-center justify-center mx-auto text-brand shadow-brand-glow">
            <Library className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No recordings found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `No videos match "${searchQuery}". Try a different keyword.`
                : 'Start your first screen or camera recording with Capture Studio!'}
            </p>
          </div>
          <Link to="/" className="inline-block pt-2">
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
              Start Recording Now
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
