"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Lock, RotateCw } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile forms
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setUsername(data.user.username);
        setEmail(data.user.email);
      } else {
        setError("Failed to load user profile.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while loading profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!profile?.id) return;

    try {
      // Re-use PATCH users/[id] endpoint to update username/email
      // (Admins can do this. If they are a manager/staff, we should also permit them to update their OWN profile.
      // Wait, our PATCH /api/admin/users/[id] requires role "admin".
      // What if a manager/staff wants to update their profile?
      // Let's make sure our PATCH /api/admin/users/[id] allows users to update their OWN profile regardless of role!)
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      if (res.ok) {
        setSuccess("Profile updated successfully. Please refresh if needed.");
        fetchProfile();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while updating profile.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        setSuccess("Password updated successfully.");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update password.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while updating password.");
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <RotateCw className="animate-spin mr-2" size={16} />
        Loading profile ...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 font-display">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and update your personal credentials and account security settings.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Card - Metadata */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-[#BF976A]/10 text-[#BF976A] flex items-center justify-center text-3xl font-display font-semibold uppercase">
            {profile?.username ? profile.username.substring(0, 2) : "AD"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 font-display">{profile?.username}</h2>
            <p className="text-xs text-gray-400 font-mono-num">{profile?.email}</p>
          </div>
          <span className="inline-flex items-center rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800 uppercase">
            <Shield size={12} className="mr-1" />
            {profile?.role}
          </span>
        </div>

        {/* Right Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Update Profile Form */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">
              Account Details
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <User size={12} />
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail size={12} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#BF976A] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#A37B50]"
                >
                  Save Account Details
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <Lock size={14} />
              Change Password
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Verify new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#BF976A] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#A37B50]"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
