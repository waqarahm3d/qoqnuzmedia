'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function MagicLinkPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signInWithOTP } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const { error: otpError } = await signInWithOTP(email);

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: '#181818',
          padding: '48px 40px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          maxWidth: '450px',
          width: '100%',
          border: '1px solid #282828',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '8px',
              letterSpacing: '-0.5px',
            }}
          >
            🎵 Qoqnuz Music
          </h1>
          <p style={{ fontSize: '16px', color: '#b3b3b3', margin: 0 }}>
            {success ? 'Check your email' : 'Sign in with a one-time code'}
          </p>
        </div>

        {/* Info Box */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(29, 185, 84, 0.1)',
            border: '1px solid rgba(29, 185, 84, 0.3)',
            borderRadius: '4px',
            marginBottom: '24px',
            color: '#1DB954',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          <strong>ℹ️ Info:</strong> We'll send you a magic link to sign in without a password.
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(230, 77, 77, 0.1)',
              border: '1px solid rgba(230, 77, 77, 0.5)',
              borderRadius: '4px',
              marginBottom: '24px',
              color: '#e64d4d',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(29, 185, 84, 0.1)',
              border: '1px solid rgba(29, 185, 84, 0.5)',
              borderRadius: '4px',
              marginBottom: '24px',
              color: '#1DB954',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <strong>✓ Success!</strong> We've sent you a magic link! Please check your email inbox and spam folder. Click the link to sign in instantly.
          </div>
        )}

        {!success ? (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: '#121212',
                    color: '#ffffff',
                    border: '1px solid #727272',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1DB954')}
                  onBlur={(e) => (e.target.style.borderColor = '#727272')}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? '#535353' : '#1DB954',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '500px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(29, 185, 84, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.04)';
                    e.currentTarget.style.background = '#1ed760';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#1DB954';
                  }
                }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '32px 0',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: '#282828' }} />
              <span style={{ color: '#b3b3b3', fontSize: '12px', fontWeight: '700' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#282828' }} />
            </div>

            {/* Back to Sign In */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '8px' }}>
                Already have a password?
              </p>
              <Link
                href="/auth/signin"
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  color: '#b3b3b3',
                  fontSize: '14px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  border: '1px solid #727272',
                  borderRadius: '500px',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ffffff';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#727272';
                  e.currentTarget.style.color = '#b3b3b3';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Sign in with password
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Link
              href="/auth/signin"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                color: '#b3b3b3',
                fontSize: '14px',
                fontWeight: '700',
                textDecoration: 'none',
                border: '1px solid #727272',
                borderRadius: '500px',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#727272';
                e.currentTarget.style.color = '#b3b3b3';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ← Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
