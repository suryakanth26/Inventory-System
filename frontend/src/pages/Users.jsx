import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Lock, 
  AlertCircle 
} from 'lucide-react';
import { usersApi } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Users = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'STAFF',
  });

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data || []);
    } catch (err) {
      error('Failed to load user roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '600px', margin: '40px auto' }}>
        <ShieldCheck size={48} color="var(--danger-text)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          User Administration requires the <strong>ADMIN</strong> security role. Your active role is <strong>{currentUser?.role || 'STAFF'}</strong>.
        </p>
      </div>
    );
  }

  // Open Create
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'STAFF',
    });
    setUserModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      password: '', // leave empty if unchanged
      role: user.role || 'STAFF',
    });
    setUserModalOpen(true);
  };

  // Submit User
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      error('Username is required');
      return;
    }
    if (!editingUser && !formData.password) {
      error('Password is required for new accounts');
      return;
    }

    setSaving(true);
    const payload = {
      username: formData.username.trim(),
      role: formData.role,
    };
    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (editingUser) {
        payload.id = editingUser.id;
        await usersApi.update(editingUser.id, payload);
        success(`User '${payload.username}' updated successfully!`);
      } else {
        await usersApi.create(payload);
        success(`User '${payload.username}' created!`);
      }
      setUserModalOpen(false);
      loadUsers();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to save user account');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.username === currentUser?.username) {
      error('You cannot delete your own currently active account!');
      setDeleteModalOpen(false);
      return;
    }

    setSaving(true);
    try {
      await usersApi.delete(userToDelete.id);
      success(`User account '${userToDelete.username}' deleted.`);
      setDeleteModalOpen(false);
      loadUsers();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            User Administration & RBAC
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage staff credentials, access permissions, and role hierarchy
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadUsers} className="neu-button" title="Refresh user list">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button onClick={handleOpenCreate} className="neu-button neu-button-primary">
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Assigned Role</th>
              <th>Permissions Summary</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isCurrent = u.username === currentUser?.username;
              return (
                <tr key={u.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      #{u.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {u.username}
                      </span>
                      {isCurrent && (
                        <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={u.role} />
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {u.role === 'ADMIN'
                        ? 'Full System Control (CRUD, Users, Logs)'
                        : u.role === 'MANAGER'
                        ? 'Product & Supplier Management, Stock Approvals'
                        : 'Inventory Scanning, Stock In/Out movements'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="neu-button neu-button-sm"
                        title="Edit credentials or role"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserToDelete(u);
                          setDeleteModalOpen(true);
                        }}
                        disabled={isCurrent}
                        className="neu-button neu-button-sm"
                        style={{ color: isCurrent ? 'var(--text-muted)' : 'var(--danger-text)' }}
                        title={isCurrent ? 'Cannot delete yourself' : 'Delete user'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.username}` : 'Provision New User'}
        subtitle="Configure system login credentials and role-based operational permissions."
      >
        <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Username *
            </label>
            <input
              type="text"
              className="neu-input"
              placeholder="e.g. jdoe_warehouse"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              {editingUser ? 'Reset Password (leave empty to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              className="neu-input"
              placeholder={editingUser ? '••••••••' : 'At least 6 characters'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Role Assignment *
            </label>
            <select
              className="neu-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="STAFF">Staff (Daily Stock-In / Stock-Out Operations)</option>
              <option value="MANAGER">Manager (Product, Supplier & Catalog Oversight)</option>
              <option value="ADMIN">Admin (Full System Privilege & User Administration)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setUserModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="neu-button neu-button-primary">
              {saving ? 'Saving...' : (editingUser ? 'Save User' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Revoke User Access"
        subtitle="This action will permanently delete this account from the authentication store."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={22} color="var(--danger-text)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
              Are you sure you want to permanently delete account <strong>{userToDelete?.username}</strong>?
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setDeleteModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={confirmDelete}
              className="neu-button neu-button-danger"
            >
              {saving ? 'Revoking...' : 'Revoke Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
