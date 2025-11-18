import { ReactNode, useState } from 'react';
import { PlayIcon } from '../icons';

interface SmartPlaylistCardProps {
  title: string;
  description: string;
  icon: string;
  type: string;
  trackCount?: number;
  loading?: boolean;
  onGenerate: () => Promise<void>;
}

export const SmartPlaylistCard = ({
  title,
  description,
  icon,
  type,
  trackCount,
  loading = false,
  onGenerate,
}: SmartPlaylistCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="group relative bg-surface/40 hover:bg-surface rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 text-3xl">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white mb-1">{title}</h3>
          <p className="text-sm text-white/60 mb-3">{description}</p>

          {trackCount !== undefined && (
            <p className="text-xs text-white/40">{trackCount} tracks</p>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-4 py-2 bg-primary hover:bg-[#ff5c2e] text-black font-semibold rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <PlayIcon size={16} />
              <span>Generate</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
