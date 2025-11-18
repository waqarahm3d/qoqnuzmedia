import Link from 'next/link';

interface ActivityCardProps {
  name: string;
  emoji: string;
  description: string;
}

export const ActivityCard = ({ name, emoji, description }: ActivityCardProps) => {
  return (
    <Link
      href={`/discover/activity/${name}`}
      className="group relative bg-surface/40 hover:bg-surface rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-105"
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl">{emoji}</div>
        <div>
          <h3 className="font-bold text-white capitalize">{name}</h3>
          <p className="text-sm text-white/60">{description}</p>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};
