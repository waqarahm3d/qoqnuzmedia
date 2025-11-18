import Link from 'next/link';

interface MoodCardProps {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export const MoodCard = ({ name, emoji, description, color }: MoodCardProps) => {
  return (
    <Link
      href={`/discover/mood/${name}`}
      className={`group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${color}`}
    >
      <div className="relative z-10">
        <div className="text-4xl mb-3">{emoji}</div>
        <h3 className="font-bold text-lg text-white mb-1 capitalize">{name}</h3>
        <p className="text-sm text-white/80">{description}</p>
      </div>

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
};
