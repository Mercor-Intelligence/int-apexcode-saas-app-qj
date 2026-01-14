import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { User, Lock, Trash2, AlertCircle, Check, Loader2 } from 'lucide-react';
import './SettingsTab.css';

export default function SettingsTab({ profile, onUpdate }) {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    // In production, this would call an API endpoint
    alert('Account deletion would be processed here. Your data will be deleted within 14 days.');
    logout();
  };

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h2>Settings</h2>
        <p>Manage your account settings</p>
      </div>

      {/* Account Info */}
      <section className="settings-section">
        <h3><User size={18} /> Account</h3>
        
        <div className="setting-item">
          <label>Email</label>
          <span className="setting-value">{profile?.email}</span>
        </div>
        
        <div className="setting-item">
          <label>Handle</label>
          <span className="setting-value">@{profile?.handle}</span>
        </div>
        
        <div className="setting-item">
          <label>Plan</label>
          <span className="setting-value plan-badge">
            {profile?.planTier === 'premium' ? 'Premium' : 'Free'}
          </span>
        </div>
      </section>

      {/* Change Password */}
      <section className="settings-section">
        <h3><Lock size={18} /> Change Password</h3>
        
        <form onSubmit={handleChangePassword} className="password-form">
          <div className="input-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          <div className="input-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          
          {passwordError && (
            <div className="message error">
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="message success">
              <Check size={16} />
              {passwordSuccess}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={changingPassword}>
            {changingPassword ? (
              <>
                <Loader2 size={16} className="spin" />
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="settings-section danger">
        <h3><Trash2 size={18} /> Danger Zone</h3>
        
        <div className="danger-content">
          <div>
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all data. This action cannot be undone.</p>
          </div>
          
          <button 
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        </div>
        
        {showDeleteConfirm && (
          <div className="delete-confirm">
            <p>Are you sure? This will permanently delete your account and all data after a 14-day grace period.</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>
                Yes, Delete My Account
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


