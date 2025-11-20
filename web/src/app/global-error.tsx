'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
          }}>
            <h1 style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: '#ff4a14',
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '1.2rem',
              marginBottom: '2rem',
              color: '#b3b3b3',
            }}>
              We're sorry for the inconvenience. The error has been reported and we'll fix it soon.
            </p>
            <button
              onClick={() => window.location.href = '/home'}
              style={{
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#fff',
                background: '#ff4a14',
                border: 'none',
                borderRadius: '500px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ff5c2e'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ff4a14'}
            >
              Go to Home
            </button>
          </div>
        </div>
        {/* This is the default Next.js error component but it doesn't allow omitting the statusCode property yet. */}
        {/* <NextError statusCode={undefined as any} /> */}
      </body>
    </html>
  );
}
