'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const BPMCalculator = () => {
  const [bpm, setBpm] = useState(160);
  const router = useRouter();

  const presets = [
    { name: 'Yoga', bpm: 70, range: 10 },
    { name: 'Walking', bpm: 120, range: 10 },
    { name: 'Cycling', bpm: 130, range: 10 },
    { name: 'Running', bpm: 165, range: 10 },
    { name: 'HIIT', bpm: 175, range: 15 },
  ];

  const handleSearch = () => {
    router.push(`/discover/bpm/${bpm}`);
  };

  return (
    <div className="bg-surface/40 rounded-lg p-6">
      <h3 className="font-bold text-xl text-white mb-2">BPM-Based Discovery</h3>
      <p className="text-sm text-white/60 mb-6">Find tracks at a specific tempo - perfect for workouts!</p>

      {/* BPM Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/80 mb-2">Target BPM</label>
        <div className="flex gap-3">
          <input
            type="number"
            min="40"
            max="220"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
            className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-primary hover:bg-[#ff5c2e] text-black font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => router.push(`/discover/bpm/${preset.bpm}`)}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <div className="font-semibold">{preset.name}</div>
            <div className="text-xs text-white/60">{preset.bpm} BPM</div>
          </button>
        ))}
      </div>
    </div>
  );
};
