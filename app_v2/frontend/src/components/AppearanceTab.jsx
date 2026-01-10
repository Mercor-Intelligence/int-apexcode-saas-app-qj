import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Camera, Check, Loader2 } from 'lucide-react';
import './AppearanceTab.css';

const THEMES = [
  { id: 'dark', name: 'Dark', preview: '#0a0a0a' },
  { id: 'light', name: 'Light', preview: '#ffffff' },
  { id: 'sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #764ba2, #f093fb)' },
  { id: 'ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #1a2a6c, #21d4fd)' },
  { id: 'forest', name: 'Forest', preview: 'linear-gradient(135deg, #134E5E, #71B280)' },
  { id: 'neon', name: 'Neon', preview: '#0a0014' },
  { id: 'minimal', name: 'Minimal', preview: '#f5f5f5' }
];

const BUTTON_STYLES = [
  { id: 'rounded', name: 'Rounded' },
  { id: 'rectangular', name: 'Rectangle' },
  { id: 'pill', name: 'Pill' },
  { id: 'outline', name: 'Outline' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'gradient', name: 'Gradient' }
];

const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Poppins', name: 'Poppins' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Montserrat', name: 'Montserrat' },
  { id: 'Playfair Display', name: 'Playfair' },
  { id: 'Space Grotesk', name: 'Space Grotesk' }
];

export default function AppearanceTab({ profile, setProfile, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChange = async (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    setSaving(true);
    try {
      await api.put('/profile', { [field]: value });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await api.upload('/profile/avatar', formData);
      const data = await response.json();
      if (response.ok) {
        setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="appearance-tab">
      <div className="tab-header">
        <h2>Appearance</h2>
        <p>Customize your profile look</p>
        {saving && <span className="saving-indicator"><Loader2 size={14} className="spin" /> Saving...</span>}
      </div>

      {/* Profile Section */}
      <section className="appearance-section">
        <h3>Profile</h3>
        
        <div className="avatar-upload">
          <div className="avatar-preview">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {(profile.displayName || profile.handle)?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {uploadingAvatar && (
              <div className="avatar-uploading">
                <Loader2 size={24} className="spin" />
              </div>
            )}
          </div>
          <label className="avatar-btn">
            <Camera size={18} />
            Change avatar
            <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
          </label>
        </div>
        
        <div className="input-group">
          <label>Profile Title</label>
          <input
            type="text"
            value={profile.bioTitle || ''}
            onChange={e => handleChange('bioTitle', e.target.value)}
            placeholder="Your name or title"
            className="input"
            maxLength={60}
          />
          <span className="char-count">{(profile.bioTitle || '').length}/60</span>
        </div>
        
        <div className="input-group">
          <label>Bio</label>
          <input
            type="text"
            value={profile.bioDescription || ''}
            onChange={e => handleChange('bioDescription', e.target.value)}
            placeholder="A short bio about you"
            className="input"
            maxLength={150}
          />
          <span className="char-count">{(profile.bioDescription || '').length}/150</span>
        </div>
      </section>

      {/* Themes */}
      <section className="appearance-section">
        <h3>Theme</h3>
        <div className="theme-grid">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              className={`theme-card ${profile.theme === theme.id ? 'active' : ''}`}
              onClick={() => handleChange('theme', theme.id)}
            >
              <div className="theme-preview" style={{ background: theme.preview }} />
              <span>{theme.name}</span>
              {profile.theme === theme.id && <Check size={16} className="check" />}
            </button>
          ))}
        </div>
      </section>

      {/* Button Style */}
      <section className="appearance-section">
        <h3>Button Style</h3>
        <div className="button-style-grid">
          {BUTTON_STYLES.map(style => (
            <button
              key={style.id}
              className={`style-card ${profile.buttonStyle === style.id ? 'active' : ''}`}
              onClick={() => handleChange('buttonStyle', style.id)}
            >
              <div className={`style-preview ${style.id}`} />
              <span>{style.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Fonts */}
      <section className="appearance-section">
        <h3>Font</h3>
        <div className="font-grid">
          {FONTS.map(font => (
            <button
              key={font.id}
              className={`font-card ${profile.fontFamily === font.id ? 'active' : ''}`}
              onClick={() => handleChange('fontFamily', font.id)}
              style={{ fontFamily: font.id }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

