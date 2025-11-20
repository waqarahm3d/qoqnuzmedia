'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase-client';

function SignInForm() {
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

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
            : undefined,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

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

        {/* Social Login Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid #727272',
              borderRadius: '500px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#727272';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => handleSocialLogin('apple')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid #727272',
              borderRadius: '500px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#727272';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>
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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #282828',
            borderTop: '4px solid #ff4a14',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#b3b3b3' }}>Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
