import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Shield, Store, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('STAFF');

  const { login, register, loading } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error('Please enter both username and password');
      return;
    }

    const res = await login(username.trim(), password);
    if (res.success) {
      success(`Welcome, ${res.user.username}`);
      navigate('/');
    } else {
      error(res.error || 'Authentication failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error('Username and password are required');
      return;
    }
    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    const res = await register({ username: username.trim(), password, role });
    if (res.success) {
      success(`Account '${username}' created`);
      const loginRes = await login(username.trim(), password);
      if (loginRes.success) navigate('/');
      else setIsRegisterMode(false);
    } else {
      error(res.error || 'Registration failed');
    }
  };

  return (
    <div className="login-stage">
      <div className="liquid-blob" style={{ position: 'absolute', width: 300, height: 280, right: '10%', top: '14%', pointerEvents: 'none', opacity: 0.85 }} />
      <div className="liquid-blob" style={{ position: 'absolute', width: 220, height: 200, left: '8%', bottom: '12%', pointerEvents: 'none', opacity: 0.7 }} />
      <div
        className="glass-panel-elevated"
        style={{ width: '100%', maxWidth: 440, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 12px', width: 52, height: 52, borderRadius: 18 }}>
            <Store size={26} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 750 }}>Our Store</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Inventory Management & POS System
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            padding: 4,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.28)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          {['Sign In', 'Register'].map((label, i) => {
            const active = i === 1 ? isRegisterMode : !isRegisterMode;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setIsRegisterMode(i === 1)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: 13,
                  background: active ? 'rgba(255,255,255,0.7)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: active ? '0 6px 14px rgba(80,70,120,0.08)' : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Username</span>
              <div style={{ position: 'relative' }}>
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="neu-input" style={{ paddingLeft: 38 }} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required />
              </div>
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Password</span>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" className="neu-input" style={{ paddingLeft: 38 }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </label>
            <button type="submit" disabled={loading} className="neu-button neu-button-primary" style={{ padding: 12, marginTop: 4 }}>
              {loading ? <><span className="spinner-min" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="neu-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" className="neu-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" className="neu-input" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <select className="neu-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" disabled={loading} className="neu-button neu-button-primary" style={{ padding: 12 }}>
              {loading ? <><span className="spinner-min" /> Creating…</> : 'Create account'}
            </button>
          </form>
        )}

        <button type="button" className="neu-button" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
          <Shield size={14} /> admin / admin123
        </button>
      </div>
    </div>
  );
};
