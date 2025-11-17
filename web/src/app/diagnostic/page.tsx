'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const diagnostics: any = {};

    // Test 1: Check Supabase connection
    try {
      const { data, error } = await supabase.from('artists').select('count');
      diagnostics.connection = error ? `Error: ${error.message}` : 'Connected ✓';
    } catch (e: any) {
      diagnostics.connection = `Failed: ${e.message}`;
    }

    // Test 2: Get artists count
    try {
      const { data, error, count } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true });
      diagnostics.artistsCount = error ? `Error: ${error.message}` : `${count} artists`;
    } catch (e: any) {
      diagnostics.artistsCount = `Failed: ${e.message}`;
    }

    // Test 3: Get albums count
    try {
      const { data, error, count } = await supabase
        .from('albums')
        .select('*', { count: 'exact', head: true });
      diagnostics.albumsCount = error ? `Error: ${error.message}` : `${count} albums`;
    } catch (e: any) {
      diagnostics.albumsCount = `Failed: ${e.message}`;
    }

    // Test 4: Get tracks count
    try {
      const { data, error, count } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true });
      diagnostics.tracksCount = error ? `Error: ${error.message}` : `${count} tracks`;
    } catch (e: any) {
      diagnostics.tracksCount = `Failed: ${e.message}`;
    }

    // Test 5: Actually fetch some artists
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, avatar_url, verified')
        .limit(5);
      diagnostics.artistsFetch = error
        ? `Error: ${error.message}`
        : `Fetched ${data?.length || 0} artists`;
      diagnostics.artistsData = data;
    } catch (e: any) {
      diagnostics.artistsFetch = `Failed: ${e.message}`;
    }

    // Test 6: Fetch albums with artist relation
    try {
      const { data, error } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          cover_art_url,
          artists (
            id,
            name
          )
        `)
        .limit(5);
      diagnostics.albumsFetch = error
        ? `Error: ${error.message}`
        : `Fetched ${data?.length || 0} albums`;
      diagnostics.albumsData = data;
    } catch (e: any) {
      diagnostics.albumsFetch = `Failed: ${e.message}`;
    }

    // Test 7: Fetch tracks with relations
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artists (id, name),
          albums (id, title)
        `)
        .limit(5);
      diagnostics.tracksFetch = error
        ? `Error: ${error.message}`
        : `Fetched ${data?.length || 0} tracks`;
      diagnostics.tracksData = data;
    } catch (e: any) {
      diagnostics.tracksFetch = `Failed: ${e.message}`;
    }

    // Test 8: Check RLS policies
    try {
      const { data, error } = await supabase.rpc('get_my_claims');
      diagnostics.userClaims = error ? `Error: ${error.message}` : data;
    } catch (e: any) {
      diagnostics.userClaims = 'No custom function';
    }

    // Test 9: Test the API client methods
    try {
      const response = await fetch('/api/search?q=test&limit=5');
      const data = await response.json();
      diagnostics.searchAPI = `Status ${response.status}: ${JSON.stringify(data).substring(0, 100)}`;
    } catch (e: any) {
      diagnostics.searchAPI = `Failed: ${e.message}`;
    }

    setResults(diagnostics);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Running Diagnostics...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Diagnostics</h1>

        <div className="space-y-4">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2 text-green-400">{key}</h3>
              {typeof value === 'string' ? (
                <p className="text-gray-300 font-mono text-sm">{value}</p>
              ) : (
                <pre className="text-gray-300 font-mono text-xs overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Check if counts show 0 - means no data in database</li>
            <li>Check for "Error" messages - indicates query or RLS issues</li>
            <li>artistsData/albumsData/tracksData should show actual records</li>
            <li>If counts are &gt; 0 but fetches return 0, it's an RLS issue</li>
          </ul>
        </div>

        <div className="mt-4 flex gap-4">
          <button
            onClick={runDiagnostics}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Re-run Diagnostics
          </button>
          <a
            href="/admin"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg inline-block"
          >
            Go to Admin
          </a>
          <a
            href="/home"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg inline-block"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
