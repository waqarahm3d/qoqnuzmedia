'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // MFA States
  const [showMfaVerify, setShowMfaVerify] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');

  const { signIn, verifyMFAChallenge } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else if (data?.user?.factors && data.user.factors.length > 0) {
      // MFA is enabled, show verification UI
      setMfaFactorId(data.user.factors[0].id);
      setShowMfaVerify(true);
      setLoading(false);
    } else {
      // No MFA, proceed to redirect destination
      router.push(redirectTo);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    const { error: verifyError } = await verifyMFAChallenge(mfaFactorId, mfaCode);

    if (verifyError) {
      setError(verifyError.message || 'Invalid code. Please try again.');
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  // Show MFA verification form if needed
  if (showMfaVerify) {
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
              Two-Factor Authentication
            </h1>
            <p style={{ fontSize: '16px', color: '#b3b3b3', margin: 0 }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

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

          <form onSubmit={handleMfaVerify}>
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="mfaCode"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                Verification Code
              </label>
              <input
                id="mfaCode"
                type="text"
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #727272',
                  borderRadius: '4px',
                  fontSize: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  textAlign: 'center',
                  letterSpacing: '8px',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ff4a14')}
                onBlur={(e) => (e.target.style.borderColor = '#727272')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              style={{
                width: '100%',
                padding: '16px',
                background: loading || mfaCode.length !== 6 ? '#535353' : '#ff4a14',
                color: '#ffffff',
                border: 'none',
                borderRadius: '500px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading || mfaCode.length !== 6 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
              onMouseEnter={(e) => {
                if (!loading && mfaCode.length === 6) {
                  e.currentTarget.style.transform = 'scale(1.04)';
                  e.currentTarget.style.background = '#ff5c2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && mfaCode.length === 6) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#ff4a14';
                }
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setShowMfaVerify(false);
                  setMfaCode('');
                  setError('');
                }}
                style={{
                  color: '#b3b3b3',
                  fontSize: '14px',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#b3b3b3')}
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            Sign in to continue
          </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
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
              onFocus={(e) => (e.target.style.borderColor = '#ff4a14')}
              onBlur={(e) => (e.target.style.borderColor = '#727272')}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '8px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
              onFocus={(e) => (e.target.style.borderColor = '#ff4a14')}
              onBlur={(e) => (e.target.style.borderColor = '#727272')}
            />
          </div>

          {/* Forgot Password Link */}
          <div style={{ marginBottom: '24px', textAlign: 'right' }}>
            <Link
              href="/auth/forgot-password"
              style={{
                color: '#b3b3b3',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#b3b3b3')}
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#535353' : '#ff4a14',
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
                e.currentTarget.style.background = '#ff5c2e';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#ff4a14';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
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

        {/* Magic Link Login */}
        <Link
          href="/auth/magic-link"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 32px',
            marginBottom: '32px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
            textDecoration: 'none',
            textAlign: 'center',
            border: '1px solid #727272',
            borderRadius: '500px',
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ffffff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#727272';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Login with one-time code
        </Link>

        {/* Sign Up Link */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '8px' }}>
            Don't have an account?
          </p>
          <Link
            href="/auth/signup"
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
            Sign up for Qoqnuz
          </Link>
        </div>

        {/* Go to Home Link */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            href="/home"
            style={{
              color: '#b3b3b3',
              fontSize: '14px',
              textDecoration: 'underline',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#b3b3b3')}
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
