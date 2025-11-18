'use client';

import { useEffect, useState } from 'react';
import { getUserProfile, updateUserProfile } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // MFA States
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [showMfaEnroll, setShowMfaEnroll] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState('');

  const { user, enrollMFA, verifyMFAEnrollment, unenrollMFA, getMFAFactors } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
    fetchMfaFactors();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      setDisplayName(data?.display_name || '');
      setBio(data?.bio || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMfaFactors = async () => {
    try {
      const { data, error } = await getMFAFactors();
      if (!error && data?.totp) {
        setMfaFactors(data.totp);
      }
    } catch (error) {
      console.error('Failed to fetch MFA factors:', error);
    }
  };

  const handleEnrollMFA = async () => {
    setMfaLoading(true);
    setMfaMessage('');
    try {
      const { data, error } = await enrollMFA();
      if (error) throw error;

      setMfaQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setShowMfaEnroll(true);
    } catch (error: any) {
      setMfaMessage('Failed to enroll MFA: ' + error.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaCode) {
      setMfaMessage('Please enter the 6-digit code');
      return;
    }

    setMfaLoading(true);
    setMfaMessage('');
    try {
      const { error } = await verifyMFAEnrollment(mfaCode);
      if (error) throw error;

      setMfaMessage('MFA enabled successfully!');
      setShowMfaEnroll(false);
      setMfaCode('');
      await fetchMfaFactors();
    } catch (error: any) {
      setMfaMessage('Invalid code. Please try again.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMFA = async (factorId: string) => {
    if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return;
    }

    setMfaLoading(true);
    setMfaMessage('');
    try {
      const { error } = await unenrollMFA(factorId);
      if (error) throw error;

      setMfaMessage('MFA disabled successfully');
      await fetchMfaFactors();
    } catch (error: any) {
      setMfaMessage('Failed to disable MFA: ' + error.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await updateUserProfile({
        display_name: displayName,
        bio: bio,
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Profile Settings */}
        <div className="bg-gray-800/50 rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Profile Information</h2>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-gray-900 text-gray-400 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5c2e]"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5c2e] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {bio.length}/500 characters
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('success')
                  ? 'bg-[#ff4a14]/30 text-[#ff5c2e] border border-[#ff4a14]'
                  : 'bg-red-900/30 text-red-400 border border-red-600'
              }`}>
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#ff4a14] text-white font-semibold rounded-full hover:bg-[#d43e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Account Settings */}
        <div className="bg-gray-800/50 rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">Playback Quality</h3>
                <p className="text-sm text-gray-400">Automatic (based on connection)</p>
              </div>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">Language</h3>
                <p className="text-sm text-gray-400">English</p>
              </div>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">Explicit Content</h3>
                <p className="text-sm text-gray-400">Allow playback of explicit content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4a14]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings - MFA */}
        <div className="bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Security</h2>

          {/* MFA Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">Two-Factor Authentication (2FA)</h3>
                <p className="text-sm text-gray-400">
                  {mfaFactors.length > 0
                    ? 'Enabled - Your account is protected with 2FA'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
              {mfaFactors.length === 0 ? (
                <button
                  onClick={handleEnrollMFA}
                  disabled={mfaLoading}
                  className="px-4 py-2 bg-[#ff4a14] text-white rounded-lg hover:bg-[#d43e11] transition-colors disabled:opacity-50"
                >
                  {mfaLoading ? 'Loading...' : 'Enable 2FA'}
                </button>
              ) : (
                <button
                  onClick={() => handleDisableMFA(mfaFactors[0].id)}
                  disabled={mfaLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {mfaLoading ? 'Loading...' : 'Disable 2FA'}
                </button>
              )}
            </div>
          </div>

          {/* MFA Message */}
          {mfaMessage && (
            <div className={`p-4 rounded-lg mb-6 ${
              mfaMessage.includes('success')
                ? 'bg-[#ff4a14]/30 text-[#ff5c2e] border border-[#ff4a14]'
                : 'bg-red-900/30 text-red-400 border border-red-600'
            }`}>
              {mfaMessage}
            </div>
          )}

          {/* MFA Enrollment Modal */}
          {showMfaEnroll && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
                <h3 className="text-2xl font-bold mb-4">Enable Two-Factor Authentication</h3>

                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>

                  {/* QR Code */}
                  {mfaQrCode && (
                    <div className="bg-white p-4 rounded-lg flex justify-center">
                      <img src={mfaQrCode} alt="MFA QR Code" className="w-48 h-48" />
                    </div>
                  )}

                  {/* Secret Key */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Or enter this key manually:</p>
                    <code className="block bg-gray-900 p-3 rounded text-sm text-[#ff4a14] break-all">
                      {mfaSecret}
                    </code>
                  </div>

                  {/* Verification Code Input */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Enter 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#ff5c2e]"
                      maxLength={6}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleVerifyMFA}
                      disabled={mfaLoading || mfaCode.length !== 6}
                      className="flex-1 px-6 py-3 bg-[#ff4a14] text-white font-semibold rounded-lg hover:bg-[#d43e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMfaEnroll(false);
                        setMfaCode('');
                        setMfaMessage('');
                      }}
                      disabled={mfaLoading}
                      className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
