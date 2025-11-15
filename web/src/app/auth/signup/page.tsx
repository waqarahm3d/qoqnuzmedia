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
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password || !fullName || !dateOfBirth || !gender) {
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

    // Age validation (must be at least 13 years old)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (age < 13 || (age === 13 && monthDiff < 0)) {
      setError('You must be at least 13 years old to sign up');
      return;
    }

    try {
      setLoading(true);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
          data: {
            full_name: fullName,
            date_of_birth: dateOfBirth,
            gender: gender,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: username,
            display_name: fullName,
            full_name: fullName,
            date_of_birth: dateOfBirth,
            gender: gender,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        alert('Account created! Please check your email to verify your account.');
        router.push('/auth/signin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <>
      <div className="signup-container">
        <div className="signup-card">
          <div className="logo-section">
            <h1 className="logo">Qoqnuz</h1>
            <p className="tagline">Sign up to start listening</p>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 characters)"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="form-input"
                required
              />
              <p className="form-hint">You must be at least 13 years old</p>
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select gender</option>
                <option value="man">Man</option>
                <option value="woman">Woman</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Something else</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button onClick={() => handleSocialLogin('google')} className="btn-social" type="button">
            Continue with Google
          </button>
          <button onClick={() => handleSocialLogin('apple')} className="btn-social" type="button">
            Continue with Apple
          </button>

          <p className="footer-text">
            Already have an account?{' '}
            <Link href="/auth/signin">Log in here</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .signup-card {
          width: 100%;
          max-width: 450px;
          background: #181818;
          border-radius: 12px;
          border: 1px solid #282828;
          padding: 48px 40px;
        }

        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          font-size: 48px;
          font-weight: bold;
          color: #1DB954;
          margin: 0 0 8px 0;
        }

        .tagline {
          color: #b3b3b3;
          font-size: 14px;
          margin: 0;
        }

        .error-box {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
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
          padding: 14px 16px;
          background: #121212;
          color: #ffffff;
          border: 1px solid #727272;
          border-radius: 4px;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
        }

        .form-input:focus {
          border-color: #1DB954;
        }

        .form-hint {
          color: #b3b3b3;
          font-size: 11px;
          margin: 4px 0 0 0;
        }

        .btn-primary {
          width: 100%;
          padding: 16px;
          background: #1DB954;
          color: #000000;
          border: none;
          border-radius: 500px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 16px;
        }

        .btn-primary:hover {
          background: #1ed760;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-social {
          width: 100%;
          padding: 14px 16px;
          background: transparent;
          color: #ffffff;
          border: 1px solid #727272;
          border-radius: 500px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .btn-social:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
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

        .footer-text {
          text-align: center;
          color: #b3b3b3;
          margin-top: 24px;
          font-size: 14px;
        }

        .footer-text a {
          color: #ffffff;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
