'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

interface PasswordRequirements {
  minLength: boolean;
  hasLetter: boolean;
  hasNumberOrSpecial: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Email
  const [email, setEmail] = useState('');

  // Step 2: Password
  const [password, setPassword] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasLetter: false,
    hasNumberOrSpecial: false,
  });

  // Step 3: Profile
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate password requirements
  const validatePassword = (pwd: string) => {
    const requirements = {
      minLength: pwd.length >= 10,
      hasLetter: /[a-zA-Z]/.test(pwd),
      hasNumberOrSpecial: /[0-9#?!&@$%^*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
    setPasswordRequirements(requirements);
    return requirements.minLength && requirements.hasLetter && requirements.hasNumberOrSpecial;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleStep1Continue = () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setStep(2);
  };

  const handleStep2Continue = () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password does not meet requirements');
      return;
    }

    setError('');
    setStep(3);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !dateOfBirth || !gender) {
      setError('Please fill in all fields');
      return;
    }

    // Validate age (must be at least 13 years old)
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
      setError('');

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
        // Update profile with additional details
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

        // Show success message
        alert('Account created! Please check your email to verify your account.');
        router.push('/auth/signin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
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
          {/* Logo */}
          <div className="logo-section">
            <h1 className="logo">Qoqnuz</h1>
            <p className="tagline">Sign up to start listening</p>
          </div>

          {/* Progress Indicator */}
          <div className="progress-section">
            <div className="progress-bars">
              <div className={`progress-bar ${step >= 1 ? 'active' : ''}`} />
              <div className={`progress-bar ${step >= 2 ? 'active' : ''}`} />
              <div className={`progress-bar ${step >= 3 ? 'active' : ''}`} />
            </div>
            <p className="step-text">Step {step} of 3</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="step-content">
              <h2 className="step-title">Sign up with your email address</h2>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStep1Continue()}
                  placeholder="name@domain.com"
                  className="form-input"
                />
              </div>

              <button onClick={handleStep1Continue} className="btn-primary">
                Next
              </button>

              {/* Divider */}
              <div className="divider">
                <span>OR</span>
              </div>

              {/* Social Login Buttons */}
              <button onClick={() => handleSocialLogin('google')} className="btn-social">
                <span className="social-icon">🔍</span>
                Continue with Google
              </button>
              <button onClick={() => handleSocialLogin('apple')} className="btn-social">
                <span className="social-icon"></span>
                Continue with Apple
              </button>

              {/* Login Link */}
              <p className="footer-text">
                Already have an account?{' '}
                <Link href="/auth/signin" className="link">
                  Log in here
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <div className="step-content">
              <h2 className="step-title">Create a password</h2>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter password"
                  className="form-input"
                />
              </div>

              {/* Password Requirements */}
              <div className="requirements-section">
                <p className="requirements-title">Your password must contain:</p>

                <div className="requirement">
                  <div className={`requirement-check ${passwordRequirements.minLength ? 'met' : ''}`}>
                    {passwordRequirements.minLength && <span>✓</span>}
                  </div>
                  <span className={`requirement-text ${passwordRequirements.minLength ? 'met' : ''}`}>
                    At least 10 characters
                  </span>
                </div>

                <div className="requirement">
                  <div className={`requirement-check ${passwordRequirements.hasLetter ? 'met' : ''}`}>
                    {passwordRequirements.hasLetter && <span>✓</span>}
                  </div>
                  <span className={`requirement-text ${passwordRequirements.hasLetter ? 'met' : ''}`}>
                    At least 1 letter
                  </span>
                </div>

                <div className="requirement">
                  <div className={`requirement-check ${passwordRequirements.hasNumberOrSpecial ? 'met' : ''}`}>
                    {passwordRequirements.hasNumberOrSpecial && <span>✓</span>}
                  </div>
                  <span className={`requirement-text ${passwordRequirements.hasNumberOrSpecial ? 'met' : ''}`}>
                    At least 1 number or special character (# ? ! &)
                  </span>
                </div>
              </div>

              <div className="button-group">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <button
                  onClick={handleStep2Continue}
                  disabled={!validatePassword(password)}
                  className={`btn-primary ${validatePassword(password) ? '' : 'disabled'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Details */}
          {step === 3 && (
            <form onSubmit={handleSignup} className="step-content">
              <h2 className="step-title">Tell us about yourself</h2>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="form-input"
                />
                <p className="form-hint">This will appear on your profile</p>
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="form-input date-input"
                />
                <p className="form-hint">You must be at least 13 years old</p>
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">Gender</label>
                <p className="form-hint" style={{ marginBottom: '12px' }}>
                  We use your gender to help personalize our content recommendations and ads for you.
                </p>

                <div className="gender-options">
                  {[
                    { value: 'man', label: 'Man' },
                    { value: 'woman', label: 'Woman' },
                    { value: 'non-binary', label: 'Non-binary' },
                    { value: 'other', label: 'Something else' },
                    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`gender-option ${gender === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={gender === option.value}
                        onChange={(e) => setGender(e.target.value)}
                        className="gender-radio"
                      />
                      <span className="gender-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="button-group">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary ${loading ? 'disabled' : ''}`}
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>
            </form>
          )}
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

        .progress-section {
          margin-bottom: 32px;
        }

        .progress-bars {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: #282828;
          border-radius: 2px;
          transition: background 0.3s;
        }

        .progress-bar.active {
          background: #1DB954;
        }

        .step-text {
          color: #b3b3b3;
          font-size: 12px;
          text-align: center;
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

        .step-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step-title {
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 24px 0;
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
          padding: 14px 16px;
          background: #121212;
          color: #ffffff;
          border: 1px solid #727272;
          border-radius: 4px;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: #1DB954;
        }

        .date-input {
          color-scheme: dark;
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
          transition: all 0.2s;
        }

        .btn-primary:hover:not(.disabled) {
          background: #1ed760;
          transform: scale(1.02);
        }

        .btn-primary.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 16px;
          background: #282828;
          color: #ffffff;
          border: none;
          border-radius: 500px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
        }

        .btn-secondary:hover {
          background: #3e3e3e;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-social:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .social-icon {
          font-size: 18px;
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

        .link {
          color: #ffffff;
          text-decoration: underline;
        }

        .requirements-section {
          margin-bottom: 24px;
        }

        .requirements-title {
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .requirement {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .requirement-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #282828;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          transition: background 0.2s;
        }

        .requirement-check.met {
          background: #1DB954;
        }

        .requirement-check span {
          color: #000000;
          font-size: 12px;
        }

        .requirement-text {
          color: #b3b3b3;
          font-size: 13px;
          transition: color 0.2s;
        }

        .requirement-text.met {
          color: #1DB954;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .button-group .btn-primary {
          flex: 1;
          margin-bottom: 0;
        }

        .gender-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .gender-option {
          display: flex;
          align-items: center;
          padding: 12px;
          background: transparent;
          border: 1px solid #282828;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .gender-option:hover {
          background: #181818;
        }

        .gender-option.selected {
          background: #282828;
          border-color: #1DB954;
        }

        .gender-radio {
          margin-right: 12px;
          width: 18px;
          height: 18px;
          accent-color: #1DB954;
        }

        .gender-label {
          color: #ffffff;
          font-size: 14px;
        }
      `}</style>
    </>
  );
}
