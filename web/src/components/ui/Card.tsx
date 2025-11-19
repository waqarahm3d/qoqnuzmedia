import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlayIcon } from '../icons';

interface CardProps {
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  type?: 'square' | 'circle';
  onPlay?: () => void;
}

export const Card = ({
  title,
  subtitle,
  image,
  href,
  type = 'square',
  onPlay,
}: CardProps) => {
  return (
    <Link
      href={href}
      className="group relative bg-surface/30 hover:bg-surface/50 rounded-xl p-3 transition-all duration-300 hover:shadow-2xl"
    >
      <div className="relative mb-3">
        {image ? (
          <div className={`relative aspect-square overflow-hidden bg-surface shadow-lg ${
            type === 'circle' ? 'rounded-full' : 'rounded-lg'
          }`}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className={`relative aspect-square bg-surface flex items-center justify-center ${
            type === 'circle' ? 'rounded-full' : 'rounded-lg'
          }`}>
            <span className="text-4xl text-white/20">♪</span>
          </div>
        )}

        {onPlay && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onPlay();
            }}
            className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-[#ff5c2e]"
          >
            <PlayIcon size={18} className="text-black ml-0.5" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        <h3 className="font-medium text-sm text-white truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-white/50 line-clamp-2">{subtitle}</p>
        )}
      </div>
    </Link>
  );
};
