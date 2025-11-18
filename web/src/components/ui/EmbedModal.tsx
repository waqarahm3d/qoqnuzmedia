'use client';

import { useState } from 'react';
import { CloseIcon } from '@/components/icons';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'track' | 'album' | 'artist' | 'playlist';
  id: string;
  title: string;
}

export function EmbedModal({ isOpen, onClose, type, id, title }: EmbedModalProps) {
  const [size, setSize] = useState<'compact' | 'standard' | 'large'>('standard');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sizes = {
    compact: { width: 300, height: 80 },
    standard: { width: 400, height: type === 'track' ? 152 : 380 },
    large: { width: 600, height: type === 'track' ? 152 : 480 },
  };

  const embedUrl = `${window.location.origin}/embed/${type}/${id}`;
  const embedCode = `<iframe src="${embedUrl}" width="${sizes[size].width}" height="${sizes[size].height}" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            Embed {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Embedding:</p>
            <p className="text-white font-semibold">{title}</p>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Select Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['compact', 'standard', 'large'] as const).map((sizeOption) => (
                <button
                  key={sizeOption}
                  onClick={() => setSize(sizeOption)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    size === sizeOption
                      ? 'bg-[#ff4a14] text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {sizeOption.charAt(0).toUpperCase() + sizeOption.slice(1)}
                  <div className="text-xs opacity-75 mt-1">
                    {sizes[sizeOption].width}x{sizes[sizeOption].height}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Preview
            </label>
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center">
              <iframe
                src={embedUrl}
                width={sizes[size].width}
                height={sizes[size].height}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded"
              />
            </div>
          </div>

          {/* Embed Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Embed Code
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{embedCode}</code>
              </pre>
              <button
                onClick={handleCopy}
                className={`absolute top-2 right-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-[#ff4a14] text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-2">
              How to use:
            </h3>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it into your website's HTML</li>
              <li>The player will appear on your page</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
