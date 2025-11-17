'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media-utils';

interface FeaturedItem {
  id: string;
  item_id: string;
  display_order: number;
  details: any;
}

export default function ManageSectionItemsPage() {
  const params = useParams();
  const sectionId = params?.sectionId as string;
  const router = useRouter();
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [sectionType, setSectionType] = useState<string>('');
  const [sectionTitle, setSectionTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetchSectionInfo();
    fetchItems();
  }, [sectionId]);

  const fetchSectionInfo = async () => {
    try {
      const response = await fetch(`/api/admin/featured-sections`);
      if (response.ok) {
        const data = await response.json();
        const section = data.sections.find((s: any) => s.id === sectionId);
        if (section) {
          setSectionType(section.section_type);
          setSectionTitle(section.title);
        }
      }
    } catch (error) {
      console.error('Error fetching section info:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/admin/featured-sections/${sectionId}/items`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      let endpoint = '';
      if (sectionType === 'tracks') {
        endpoint = `/api/tracks?search=${encodeURIComponent(searchQuery)}`;
      } else if (sectionType === 'albums') {
        endpoint = `/api/albums?search=${encodeURIComponent(searchQuery)}`;
      } else if (sectionType === 'artists') {
        endpoint = `/api/artists?search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (sectionType === 'tracks') {
          setSearchResults(data.tracks || []);
        } else if (sectionType === 'albums') {
          setSearchResults(data.albums || []);
        } else if (sectionType === 'artists') {
          setSearchResults(data.artists || []);
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleAddItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/featured-sections/${sectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          display_order: items.length,
        }),
      });

      if (response.ok) {
        fetchItems();
        setShowAddModal(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        alert('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from the section?')) return;

    try {
      const response = await fetch(`/api/admin/featured-sections/${sectionId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{sectionTitle}</h1>
          <p className="text-gray-400 mt-1">Manage {sectionType} in this section</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-black rounded-full font-semibold hover:bg-[#1ed760]"
        >
          Add {sectionType.slice(0, -1)}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No items in this section yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-primary hover:underline"
            >
              Add your first {sectionType.slice(0, -1)}
            </button>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="bg-surface rounded-lg p-4 border border-white/10 flex items-center gap-4"
            >
              <span className="text-gray-500 font-mono w-8">{index + 1}</span>

              {item.details && (
                <>
                  {(item.details.cover_art_url || item.details.avatar_url) && getMediaUrl(item.details.cover_art_url || item.details.avatar_url) && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={getMediaUrl(item.details.cover_art_url || item.details.avatar_url)!}
                        alt={item.details.title || item.details.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {item.details.title || item.details.name}
                    </div>
                    {item.details.artists && (
                      <div className="text-sm text-gray-400 truncate">
                        {item.details.artists.name}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-surface rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-6">
              Add {sectionType.slice(0, -1)} to section
            </h2>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search for ${sectionType}...`}
                className="flex-1 px-4 py-2 bg-black/40 border border-white/10 rounded-lg"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-[#1ed760]"
              >
                Search
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Search for {sectionType} to add to this section
                </p>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-black/40 rounded-lg p-3 flex items-center gap-3 hover:bg-black/60"
                  >
                    {(result.cover_art_url || result.avatar_url) && getMediaUrl(result.cover_art_url || result.avatar_url) && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={getMediaUrl(result.cover_art_url || result.avatar_url)!}
                          alt={result.title || result.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title || result.name}</div>
                      {result.artists && (
                        <div className="text-sm text-gray-400 truncate">
                          {result.artists.name}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddItem(result.id)}
                      className="px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold hover:bg-[#1ed760]"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
