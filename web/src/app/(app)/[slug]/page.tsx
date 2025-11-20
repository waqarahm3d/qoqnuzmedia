'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  updated_at: string;
}

export default function CustomPageView() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const response = await fetch(`/api/pages/${slug}`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await response.json();
      setPage(data.page);
    } catch (error) {
      console.error('Error fetching page:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ color: '#b3b3b3' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>404</div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Page Not Found
          </h1>
          <p style={{ color: '#b3b3b3', marginBottom: '24px' }}>
            The page you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#ff4a14',
              color: '#ffffff',
              borderRadius: '500px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      padding: '80px 20px 60px',
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              color: '#b3b3b3',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* Page Content */}
        <article style={{
          background: '#181818',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #282828',
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '16px',
          }}>
            {page.title}
          </h1>

          <div style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '32px',
            paddingBottom: '32px',
            borderBottom: '1px solid #282828',
          }}>
            Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          <div
            style={{
              color: '#e5e5e5',
              fontSize: '16px',
              lineHeight: '1.8',
            }}
            className="custom-page-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>

      {/* Custom Styles for Page Content */}
      <style jsx global>{`
        .custom-page-content h1 {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin-top: 40px;
          margin-bottom: 16px;
        }

        .custom-page-content h2 {
          font-size: 28px;
          font-weight: bold;
          color: #ffffff;
          margin-top: 32px;
          margin-bottom: 14px;
        }

        .custom-page-content h3 {
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 28px;
          margin-bottom: 12px;
        }

        .custom-page-content h4 {
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 24px;
          margin-bottom: 10px;
        }

        .custom-page-content h5 {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 20px;
          margin-bottom: 8px;
        }

        .custom-page-content h6 {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .custom-page-content p {
          margin-bottom: 16px;
          line-height: 1.8;
        }

        .custom-page-content ul,
        .custom-page-content ol {
          margin-left: 24px;
          margin-bottom: 16px;
        }

        .custom-page-content li {
          margin-bottom: 8px;
        }

        .custom-page-content a {
          color: #ff4a14;
          text-decoration: underline;
        }

        .custom-page-content a:hover {
          color: #ff5c2e;
        }

        .custom-page-content strong {
          font-weight: 600;
          color: #ffffff;
        }

        .custom-page-content em {
          font-style: italic;
        }

        .custom-page-content code {
          background: #282828;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          fontSize: 14px;
        }

        .custom-page-content blockquote {
          border-left: 4px solid #ff4a14;
          padding-left: 16px;
          margin-left: 0;
          margin-bottom: 16px;
          color: #b3b3b3;
          font-style: italic;
        }

        .custom-page-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 24px 0;
        }

        .custom-page-content hr {
          border: none;
          border-top: 1px solid #282828;
          margin: 32px 0;
        }
      `}</style>
    </div>
  );
}
