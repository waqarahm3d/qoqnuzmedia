'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=/home`
            : undefined,
          data: {
            full_name: fullName,
            display_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generate unique username
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 6);
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `${baseUsername}_${timestamp}${randomStr}`;

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username,
            display_name: fullName,
            full_name: fullName,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Profile creation failed but auth succeeded - user can still sign in
        }

        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=/home`
            : undefined,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="success-title">Check your email</h1>
          <p className="success-text">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="success-hint">
            Click the link in your email to activate your account, then sign in.
          </p>
          <Link href="/auth/signin" className="btn-primary">
            Go to Sign In
          </Link>
        </div>
        <style jsx>{`
          .auth-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }
          .auth-card {
            width: 100%;
            max-width: 420px;
            background: #181818;
            border-radius: 16px;
            border: 1px solid #282828;
            padding: 48px 40px;
            text-align: center;
          }
          .success-icon {
            margin-bottom: 24px;
          }
          .success-title {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 16px 0;
          }
          .success-text {
            color: #b3b3b3;
            font-size: 15px;
            margin: 0 0 8px 0;
            line-height: 1.5;
          }
          .success-text strong {
            color: #ffffff;
          }
          .success-hint {
            color: #666;
            font-size: 13px;
            margin: 0 0 24px 0;
          }
          .btn-primary {
            display: inline-block;
            padding: 14px 32px;
            background: #ff4a14;
            color: #000000;
            border: none;
            border-radius: 500px;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
          }
          .btn-primary:hover {
            background: #ff5c2e;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo-section">
            <h1 className="logo">Qoqnuz</h1>
            <p className="tagline">Sign up to start listening</p>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="social-buttons">
            <button onClick={() => handleSocialLogin('google')} className="btn-social" type="button" disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={() => handleSocialLogin('apple')} className="btn-social" type="button" disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="divider">
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="What should we call you?"
                className="form-input"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="form-input"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="form-input"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="terms-text">
            By signing up, you agree to Qoqnuz's Terms of Service and Privacy Policy.
          </p>

          <div className="footer-links">
            <p className="footer-text">
              Already have an account?{' '}
              <Link href="/auth/signin">Log in</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #181818;
          border-radius: 16px;
          border: 1px solid #282828;
          padding: 48px 40px;
        }

        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          font-size: 42px;
          font-weight: bold;
          color: #ff4a14;
          margin: 0 0 8px 0;
        }

        .tagline {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .error-box {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          color: #ffffff;
          border: 1px solid #727272;
          border-radius: 500px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-social:hover:not(:disabled) {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-social:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
          text-align: center;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #282828;
        }

        .divider span {
          padding: 0 16px;
          color: #b3b3b3;
          font-size: 12px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          color: #ffffff;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: #121212;
          color: #ffffff;
          border: 1px solid #727272;
          border-radius: 4px;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: #ff4a14;
        }

        .form-input:disabled {
          opacity: 0.5;
        }

        .btn-primary {
          width: 100%;
          padding: 14px;
          background: #ff4a14;
          color: #000000;
          border: none;
          border-radius: 500px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #ff5c2e;
          transform: scale(1.02);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .terms-text {
          text-align: center;
          color: #666;
          font-size: 11px;
          margin: 16px 0 0 0;
          line-height: 1.4;
        }

        .footer-links {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #282828;
        }

        .footer-text {
          text-align: center;
          color: #b3b3b3;
          margin: 0;
          font-size: 14px;
        }

        .footer-text a {
          color: #ffffff;
          text-decoration: underline;
        }

        .footer-text a:hover {
          color: #ff4a14;
        }
      `}</style>
    </>
  );
}
