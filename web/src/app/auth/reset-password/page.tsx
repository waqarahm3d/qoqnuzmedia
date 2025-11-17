'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  const { updatePassword, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid recovery session
    if (session) {
      setIsValidSession(true);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error: updateError } = await updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    }
  };

  if (!isValidSession) {
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
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '16px',
            }}
          >
            Invalid or Expired Link
          </h1>
          <p style={{ fontSize: '16px', color: '#b3b3b3', marginBottom: '24px' }}>
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: '#1DB954',
              color: '#ffffff',
              borderRadius: '500px',
              fontSize: '14px',
              fontWeight: '700',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.background = '#1ed760';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#1DB954';
            }}
          >
            Request New Link
          </Link>
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
            Set New Password
          </h1>
          <p style={{ fontSize: '16px', color: '#b3b3b3', margin: 0 }}>
            {success ? 'Password updated successfully!' : 'Enter your new password'}
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
            <strong>✓ Success!</strong> Your password has been updated. Redirecting to home...
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            {/* New Password Field */}
            <div style={{ marginBottom: '20px' }}>
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
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
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

            {/* Confirm Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
