import Image from 'next/image';
import { PlayIcon, HeartIcon, HeartFilledIcon, MoreIcon, ClockIcon } from '../icons';
import { useState } from 'react';

interface TrackRowProps {
  number?: number;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  image?: string;
  isPlaying?: boolean;
  isLiked?: boolean;
  onPlay?: () => void;
  onLike?: () => void;
  showImage?: boolean;
  showAlbum?: boolean;
}

export const TrackRow = ({
  number,
  title,
  artist,
  album,
  duration,
  image,
  isPlaying = false,
  isLiked = false,
  onPlay,
  onLike,
  showImage = false,
  showAlbum = true,
}: TrackRowProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`grid grid-cols-[16px_4fr_2fr_1fr_16px] md:grid-cols-[16px_6fr_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 rounded-md hover:bg-white/5 transition-colors group ${
        isPlaying ? 'text-primary' : 'text-white/80'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Number / Play Button */}
      <div className="flex items-center justify-center">
        {isHovered || isPlaying ? (
          <button
            onClick={onPlay}
            className="text-white hover:text-primary transition-colors"
          >
            <PlayIcon size={14} />
          </button>
        ) : (
          <span className="text-sm text-white/60">{number}</span>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex items-center gap-3 min-w-0">
        {showImage && image && (
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover rounded"
              sizes="40px"
            />
          </div>
        )}
        <div className="min-w-0">
          <div className={`font-medium truncate ${isPlaying ? 'text-primary' : 'text-white'}`}>
            {title}
          </div>
          <div className="text-sm text-white/60 truncate">{artist}</div>
        </div>
      </div>

      {/* Album (hidden on mobile) */}
      {showAlbum && (
        <div className="hidden md:flex items-center min-w-0">
          <span className="text-sm text-white/60 truncate">{album}</span>
        </div>
      )}

      {/* Duration */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={onLike}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
        >
          {isLiked ? (
            <HeartFilledIcon size={16} className="text-primary" />
          ) : (
            <HeartIcon size={16} />
          )}
        </button>
        <span className="text-sm text-white/60 tabular-nums">{duration}</span>
      </div>

      {/* More Button */}
      <div className="flex items-center justify-end">
        <button className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white">
          <MoreIcon size={16} />
        </button>
      </div>
    </div>
  );
};

// Track List Header Component
export const TrackListHeader = ({ showAlbum = true }: { showAlbum?: boolean }) => {
  return (
    <div className="grid grid-cols-[16px_4fr_2fr_1fr_16px] md:grid-cols-[16px_6fr_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/10 text-sm text-white/60 uppercase tracking-wider">
      <div className="flex items-center justify-center">#</div>
      <div>Title</div>
      {showAlbum && <div className="hidden md:block">Album</div>}
      <div className="flex items-center justify-end">
        <ClockIcon size={16} />
      </div>
      <div></div>
    </div>
  );
};
