import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaCamera, FaKey, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { authService } from '../../services/dataService';
import { useAuth } from '../../hooks/useAuth';
import { getApiImageUrl } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Profile details form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreview(getApiImageUrl(user.avatar) || '');
      setLoading(false);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await authService.updateProfile(formData);
      // Update the AuthContext user object with the new profile data
      updateUser(res.data.data);
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setUpdatingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">View and update your administrator credentials, email notifications, and password settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Avatar card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-150 dark:bg-gray-800 border-2 border-primary/20 flex items-center justify-center relative group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <FaUser className="text-5xl text-gray-400" />
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs cursor-pointer transition-opacity">
              <FaCamera className="text-xl" />
              <input type="file" onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </label>
          </div>

          <div className="text-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{user?.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Right column: Form details */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FaUser className="text-primary" /> Profile Credentials
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Login Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FaSave /> {updatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FaLock className="text-secondary" /> Change Security Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Current Password</label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FaSave /> {updatingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
