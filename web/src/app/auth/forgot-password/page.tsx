'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
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
            Reset Password
          </h1>
          <p style={{ fontSize: '16px', color: '#b3b3b3', margin: 0 }}>
            {success ? 'Check your email' : 'Enter your email to reset your password'}
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
              color: '#ff4a14',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <strong>✓ Success!</strong> We've sent you a password reset link. Please check your email inbox and spam folder.
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
                  onFocus={(e) => (e.target.style.borderColor = '#ff4a14')}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/auth/signin"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: '#ff4a14',
              color: '#ffffff',
              border: 'none',
              borderRadius: '500px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              boxShadow: '0 4px 16px rgba(29, 185, 84, 0.3)',
              textAlign: 'center',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.background = '#ff5c2e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#ff4a14';
            }}
          >
            Back to Sign In
          </Link>
        )}

        {/* Back to Sign In Link */}
        {!success && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link
              href="/auth/signin"
              style={{
                color: '#b3b3b3',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#b3b3b3')}
            >
              ← Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
