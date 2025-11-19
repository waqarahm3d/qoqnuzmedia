'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DiagnosticError {
  category: string;
  message: string;
  details: string;
  fix: string;
}

interface DiagnosticWarning {
  category: string;
  message: string;
  details: string;
  fix: string;
}

interface DiagnosticInfo {
  category: string;
  data: any;
}

interface DiagnosticCheck {
  name: string;
  status: string;
  count?: number;
}

interface Diagnostics {
  timestamp: string;
  checks: DiagnosticCheck[];
  errors: DiagnosticError[];
  warnings: DiagnosticWarning[];
  info: DiagnosticInfo[];
  summary: {
    totalChecks: number;
    errors: number;
    warnings: number;
    status: string;
  };
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/diagnostics');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDiagnostics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyToClipboard = () => {
    if (diagnostics) {
      const text = JSON.stringify(diagnostics, null, 2);
      navigator.clipboard.writeText(text);
      alert('Diagnostics copied to clipboard!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Diagnostics</h1>
            <p className="text-gray-400 mt-1">
              Check system health and identify issues
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              disabled={!diagnostics}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Copy Report
            </button>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-4 py-2 bg-[#ff4a14] text-white rounded-lg hover:bg-[#e04412] transition-colors disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Diagnostics'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-red-400">Failed to run diagnostics</h3>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff4a14]"></div>
          </div>
        )}

        {/* Results */}
        {diagnostics && !loading && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className={`rounded-lg border p-6 ${getStatusBg(diagnostics.summary.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${getStatusColor(diagnostics.summary.status)}`}>
                    System Status: {diagnostics.summary.status.toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Last checked: {new Date(diagnostics.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {diagnostics.summary.totalChecks}
                    </div>
                    <div className="text-xs text-gray-400">Checks Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {diagnostics.summary.warnings}
                    </div>
                    <div className="text-xs text-gray-400">Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {diagnostics.summary.errors}
                    </div>
                    <div className="text-xs text-gray-400">Errors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {diagnostics.errors.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Errors ({diagnostics.errors.length})
                </h3>
                <div className="space-y-4">
                  {diagnostics.errors.map((err, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                            {err.category}
                          </span>
                          <h4 className="font-semibold text-white mt-2">{err.message}</h4>
                          <p className="text-sm text-gray-400 mt-1">{err.details}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <p className="text-sm text-green-400">
                          <strong>Fix:</strong> {err.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {diagnostics.warnings.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Warnings ({diagnostics.warnings.length})
                </h3>
                <div className="space-y-4">
                  {diagnostics.warnings.map((warn, i) => (
                    <div key={i} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                            {warn.category}
                          </span>
                          <h4 className="font-semibold text-white mt-2">{warn.message}</h4>
                          <p className="text-sm text-gray-400 mt-1">{warn.details}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-yellow-500/20">
                        <p className="text-sm text-green-400">
                          <strong>Fix:</strong> {warn.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                System Information
              </h3>
              <div className="space-y-4">
                {diagnostics.info.map((info, i) => (
                  <div key={i} className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">{info.category}</h4>
                    {typeof info.data === 'object' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(info.data).map(([key, value]) => (
                          <div key={key}>
                            <div className="text-xs text-gray-400 uppercase">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Passed Checks */}
            {diagnostics.checks.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Passed Checks ({diagnostics.checks.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diagnostics.checks.map((check, i) => (
                    <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-white">{check.name}</span>
                      {check.count !== undefined && (
                        <span className="text-sm text-green-400">{check.count} items</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Export */}
            <details className="bg-gray-800 rounded-lg">
              <summary className="p-4 cursor-pointer text-gray-400 hover:text-white">
                View Raw JSON (for sharing with developer)
              </summary>
              <pre className="p-4 pt-0 text-xs text-gray-400 overflow-x-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
