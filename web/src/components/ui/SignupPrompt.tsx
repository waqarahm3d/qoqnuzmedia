'use client';

import { useRouter } from 'next/navigation';

interface SignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
}

export const SignupPrompt = ({ isOpen, onClose, action = 'like this track' }: SignupPromptProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl p-8 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Create an account to {action}
        </h2>
        <p className="text-white/60 mb-8">
          Sign up to save your favorite tracks, create playlists, and get personalized recommendations.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/auth/signup')}
            className="w-full py-3 bg-primary text-black font-semibold rounded-full hover:bg-[#ff5c2a] transition-colors"
          >
            Sign up free
          </button>
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full py-3 bg-transparent border border-white/30 text-white font-semibold rounded-full hover:border-white transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};
