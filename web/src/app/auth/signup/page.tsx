'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';

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
  const [turnstileToken, setTurnstileToken] = useState('');

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

  const handleStep1Continue = async () => {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#181818',
        borderRadius: '12px',
        border: '1px solid #282828',
        padding: '48px 40px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1DB954', marginBottom: '8px' }}>
            Qoqnuz
          </h1>
          <p style={{ color: '#b3b3b3', fontSize: '14px' }}>
            Sign up to start listening
          </p>
        </div>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  background: step >= s ? '#1DB954' : '#282828',
                  borderRadius: '2px',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <p style={{ color: '#b3b3b3', fontSize: '12px', textAlign: 'center' }}>
            Step {step} of 3
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              Sign up with your email address
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #727272',
                  borderRadius: '4px',
                  fontSize: '16px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1DB954'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#727272'}
              />
            </div>

            <button
              onClick={handleStep1Continue}
              style={{
                width: '100%',
                padding: '16px',
                background: '#1DB954',
                color: '#000000',
                border: 'none',
                borderRadius: '500px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#1ed760';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#1DB954';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Next
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#282828' }} />
              <span style={{ padding: '0 16px', color: '#b3b3b3', fontSize: '12px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#282828' }} />
            </div>

            {/* Social Login Buttons */}
            <SocialButton
              icon="🔍"
              text="Continue with Google"
              onClick={() => handleSocialLogin('google')}
            />
            <SocialButton
              icon=""
              text="Continue with Apple"
              onClick={() => handleSocialLogin('apple')}
            />

            {/* Login Link */}
            <p style={{ textAlign: 'center', color: '#b3b3b3', marginTop: '24px', fontSize: '14px' }}>
              Already have an account?{' '}
              <Link href="/auth/signin" style={{ color: '#ffffff', textDecoration: 'underline' }}>
                Log in here
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              Create a password
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #727272',
                  borderRadius: '4px',
                  fontSize: '16px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1DB954'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#727272'}
              />
            </div>

            {/* Password Requirements */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                Your password must contain:
              </p>

              <RequirementCheck
                text="At least 10 characters"
                met={passwordRequirements.minLength}
              />
              <RequirementCheck
                text="At least 1 letter"
                met={passwordRequirements.hasLetter}
              />
              <RequirementCheck
                text="At least 1 number or special character (# ? ! &)"
                met={passwordRequirements.hasNumberOrSpecial}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#282828',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '500px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleStep2Continue}
                disabled={!validatePassword(password)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: validatePassword(password) ? '#1DB954' : '#282828',
                  color: validatePassword(password) ? '#000000' : '#727272',
                  border: 'none',
                  borderRadius: '500px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: validatePassword(password) ? 'pointer' : 'not-allowed',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Profile Details */}
        {step === 3 && (
          <form onSubmit={handleSignup}>
            <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              Tell us about yourself
            </h2>

            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #727272',
                  borderRadius: '4px',
                  fontSize: '16px',
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1DB954'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#727272'}
              />
              <p style={{ color: '#b3b3b3', fontSize: '11px', marginTop: '4px' }}>
                This will appear on your profile
              </p>
            </div>

            {/* Date of Birth */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#121212',
                  color: '#ffffff',
                  border: '1px solid #727272',
                  borderRadius: '4px',
                  fontSize: '16px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1DB954'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#727272'}
              />
              <p style={{ color: '#b3b3b3', fontSize: '11px', marginTop: '4px' }}>
                You must be at least 13 years old
              </p>
            </div>

            {/* Gender */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#ffffff', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                Gender
              </label>
              <p style={{ color: '#b3b3b3', fontSize: '11px', marginBottom: '12px' }}>
                We use your gender to help personalize our content recommendations and ads for you.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { value: 'man', label: 'Man' },
                  { value: 'woman', label: 'Woman' },
                  { value: 'non-binary', label: 'Non-binary' },
                  { value: 'other', label: 'Something else' },
                  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: gender === option.value ? '#282828' : 'transparent',
                      border: `1px solid ${gender === option.value ? '#1DB954' : '#282828'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      if (gender !== option.value) {
                        e.currentTarget.style.background = '#181818';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (gender !== option.value) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={gender === option.value}
                      onChange={(e) => setGender(e.target.value)}
                      style={{
                        marginRight: '12px',
                        width: '18px',
                        height: '18px',
                        accentColor: '#1DB954',
                      }}
                    />
                    <span style={{ color: '#ffffff', fontSize: '14px' }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#282828',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '500px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: loading ? '#282828' : '#1DB954',
                  color: loading ? '#727272' : '#000000',
                  border: 'none',
                  borderRadius: '500px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function RequirementCheck({ text, met }: { text: string; met: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: met ? '#1DB954' : '#282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '10px',
        transition: 'all 0.2s',
      }}>
        {met && <span style={{ color: '#000000', fontSize: '12px' }}>✓</span>}
      </div>
      <span style={{ color: met ? '#1DB954' : '#b3b3b3', fontSize: '13px', transition: 'color 0.2s' }}>
        {text}
      </span>
    </div>
  );
}

function SocialButton({ icon, text, onClick }: { icon: string; text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: 'transparent',
        color: '#ffffff',
        border: '1px solid #727272',
        borderRadius: '500px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = '#ffffff';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = '#727272';
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {text}
    </button>
  );
}
