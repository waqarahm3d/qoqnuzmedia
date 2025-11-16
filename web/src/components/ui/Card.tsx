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
      className="group relative bg-surface/40 hover:bg-surface rounded-lg p-4 transition-all duration-300 hover:shadow-xl"
    >
      <div className="relative mb-4">
        {image ? (
          <div className={`relative aspect-square overflow-hidden bg-surface shadow-lg ${
            type === 'circle' ? 'rounded-full' : 'rounded-md'
          }`}>
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className={`relative aspect-square bg-surface flex items-center justify-center ${
            type === 'circle' ? 'rounded-full' : 'rounded-md'
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
            className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-[#1ed760]"
          >
            <PlayIcon size={20} className="text-black ml-0.5" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-white truncate">{title}</h3>
        {subtitle && (
          <p className="text-sm text-white/60 line-clamp-2">{subtitle}</p>
        )}
      </div>
    </Link>
  );
};
