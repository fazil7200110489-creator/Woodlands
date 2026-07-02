"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Key, 
  UserX, 
  UserCheck, 
  RotateCw,
  X
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); // Logged in user profile

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    id: "",
    username: "",
    email: "",
    password: "",
    role: "staff",
    isActive: true,
  });

  const [passwordResetData, setPasswordResetData] = useState({
    id: "",
    username: "",
    newPassword: "",
  });

  // Fetch logged in user and list of users
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get self profile
      const meRes = await fetch("/api/admin/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      // Get users list
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      } else {
        const errData = await usersRes.json();
        setError(errData.error || "Failed to load users database.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while loading users database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(`User "${formData.username}" created successfully.`);
        setShowCreateModal(false);
        setFormData({ id: "", username: "", email: "", password: "", role: "staff", isActive: true });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create user.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while creating user.");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        setSuccess(`User "${formData.username}" updated successfully.`);
        setShowEditModal(false);
        setFormData({ id: "", username: "", email: "", password: "", role: "staff", isActive: true });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update user.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while updating user.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${passwordResetData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordResetData.newPassword }),
      });

      if (res.ok) {
        setSuccess(`Password for user "${passwordResetData.username}" has been reset successfully.`);
        setShowPasswordModal(false);
        setPasswordResetData({ id: "", username: "", newPassword: "" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while resetting password.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess(`User "${name}" deleted successfully.`);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete user.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while deleting user.");
    }
  };

  const toggleUserStatus = async (id: string, name: string, currentStatus: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setSuccess(`User "${name}" status updated to ${!currentStatus ? "Active" : "Deactivated"}.`);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to toggle user status.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while changing user status.");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <ShieldAlert size={16} className="text-red-500 mr-1.5" />;
      case "manager": return <ShieldCheck size={16} className="text-blue-500 mr-1.5" />;
      default: return <Shield size={16} className="text-gray-500 mr-1.5" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-50 text-red-700 border-red-200/50";
      case "manager": return "bg-blue-50 text-blue-700 border-blue-200/50";
      default: return "bg-gray-50 text-gray-700 border-gray-200/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Admin console to manage Woodlands administrative users, custom roles, and database access.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFormData({ id: "", username: "", email: "", password: "", role: "staff", isActive: true });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 text-xs text-white bg-[#BF976A] hover:bg-[#A37B50] rounded-xl px-4 py-2.5 transition-colors font-mono-num font-semibold uppercase tracking-wider shadow-sm"
          >
            <UserPlus size={14} />
            Add User
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs text-[#9B7340] border border-[#BF976A]/30 bg-white hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors font-mono-num font-semibold uppercase tracking-wider"
          >
            <RotateCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
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

      {/* Users Database Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-4">Username</th>
                <th scope="col" className="px-6 py-4">Email</th>
                <th scope="col" className="px-6 py-4">Role</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Last Login</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    <RotateCw className="animate-spin inline-block mr-2" size={16} />
                    Loading database ...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No users found in database.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 font-mono-num text-xs">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono-num text-gray-400">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle active status */}
                        <button
                          onClick={() => toggleUserStatus(user._id, user.username, user.isActive)}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            user.isActive 
                              ? "text-yellow-600 border-yellow-200/50 hover:bg-yellow-50" 
                              : "text-green-600 border-green-200/50 hover:bg-green-50"
                          }`}
                        >
                          {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>

                        {/* Reset password */}
                        <button
                          onClick={() => {
                            setPasswordResetData({ id: user._id, username: user.username, newPassword: "" });
                            setShowPasswordModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg border text-indigo-600 border-indigo-200/50 hover:bg-indigo-50 transition-colors"
                        >
                          <Key size={14} />
                        </button>

                        {/* Edit profile */}
                        <button
                          onClick={() => {
                            setFormData({
                              id: user._id,
                              username: user.username,
                              email: user.email,
                              password: "",
                              role: user.role,
                              isActive: user.isActive,
                            });
                            setShowEditModal(true);
                          }}
                          title="Edit User"
                          className="p-1.5 rounded-lg border text-blue-600 border-blue-200/50 hover:bg-blue-50 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          title="Delete User"
                          className="p-1.5 rounded-lg border text-red-600 border-red-200/50 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 font-display">Create Administrative User</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. john_doe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@woodlands.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:border-[#BF976A] focus:outline-none"
                >
                  <option value="staff">Staff (Reservations, orders only)</option>
                  <option value="manager">Manager (All permissions except user creation)</option>
                  <option value="admin">Administrator (Full control)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#BF976A] focus:ring-[#BF976A]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Account Active</label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#BF976A] text-white py-2.5 text-sm font-semibold hover:bg-[#A37B50]"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 font-display">Edit User Settings</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:border-[#BF976A] focus:outline-none"
                >
                  <option value="staff">Staff (Reservations, orders only)</option>
                  <option value="manager">Manager (All permissions except user creation)</option>
                  <option value="admin">Administrator (Full control)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#BF976A] focus:ring-[#BF976A]"
                />
                <label htmlFor="isActiveEdit" className="text-sm font-medium text-gray-700">Account Active</label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#BF976A] text-white py-2.5 text-sm font-semibold hover:bg-[#A37B50]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 font-display">Reset Password for "{passwordResetData.username}"</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={passwordResetData.newPassword}
                  onChange={(e) => setPasswordResetData({ ...passwordResetData, newPassword: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#BF976A] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-semibold hover:bg-red-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
