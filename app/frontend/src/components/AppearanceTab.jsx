import { useState, useRef } from 'react'
import { api } from '../utils/api'
import { Upload, Check } from 'lucide-react'
import './AppearanceTab.css'

const THEMES = [
  { id: 'default', name: 'Sunset', colors: ['#FF6B35', '#F7931E'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0A192F', '#64FFDA'] },
  { id: 'forest', name: 'Forest', colors: ['#1A1F16', '#86EFAC'] },
  { id: 'sunset', name: 'Violet', colors: ['#1F1135', '#FB923C'] },
  { id: 'minimal', name: 'Light', colors: ['#FFFFFF', '#000000'] },
]

const BUTTON_STYLES = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'rectangular', label: 'Rectangle' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'outline', label: 'Outline' },
]

const FONTS = [
  'DM Sans',
  'Playfair Display',
  'JetBrains Mono',
  'Inter',
  'Poppins',
  'Roboto',
  'Lora',
  'Montserrat',
]

export default function AppearanceTab({ profile, onUpdate }) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleChange = async (field, value) => {
    onUpdate({ [field]: value })
    setSaving(true)
    try {
      await api.put('/profile', { [field]: value })
    } catch (error) {
      console.error('Failed to update:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const { avatarUrl } = await api.upload('/profile/avatar', formData)
      onUpdate({ avatarUrl })
    } catch (error) {
      console.error('Failed to upload avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="appearance-tab">
      <div className="tab-header">
        <div>
          <h2>Appearance</h2>
          <p>Customize how your profile looks</p>
        </div>
        {saving && <span className="saving-indicator">Saving...</span>}
      </div>

      {/* Profile Section */}
      <section className="appearance-section">
        <h3>Profile</h3>
        
        <div className="avatar-upload">
          <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <div className="avatar-placeholder">
                {profile?.handle?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="avatar-overlay">
              {uploading ? (
                <div className="mini-loader"></div>
              ) : (
                <Upload size={24} />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
          <div className="avatar-info">
            <p>Click to upload avatar</p>
            <span>Recommended: 400x400px, max 5MB</span>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Profile Title</label>
            <input
              type="text"
              value={profile?.bioTitle || ''}
              onChange={(e) => handleChange('bioTitle', e.target.value)}
              placeholder="Your name or brand"
              className="input"
              maxLength={60}
            />
            <span className="char-count">{profile?.bioTitle?.length || 0}/60</span>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Bio</label>
            <input
              type="text"
              value={profile?.bioDescription || ''}
              onChange={(e) => handleChange('bioDescription', e.target.value)}
              placeholder="A short description about you"
              className="input"
              maxLength={80}
            />
            <span className="char-count">{profile?.bioDescription?.length || 0}/80</span>
          </div>
        </div>
      </section>

      {/* Themes Section */}
      <section className="appearance-section">
        <h3>Theme</h3>
        <div className="themes-grid">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className={`theme-card ${profile?.theme === theme.id ? 'active' : ''}`}
              onClick={() => handleChange('theme', theme.id)}
            >
              <div 
                className="theme-preview"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%)`,
                }}
              >
                {profile?.theme === theme.id && (
                  <div className="theme-check">
                    <Check size={16} />
                  </div>
                )}
              </div>
              <span>{theme.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Button Styles Section */}
      <section className="appearance-section">
        <h3>Button Style</h3>
        <div className="button-styles-grid">
          {BUTTON_STYLES.map((style) => (
            <button
              key={style.id}
              className={`style-card ${profile?.buttonStyle === style.id ? 'active' : ''}`}
              onClick={() => handleChange('buttonStyle', style.id)}
            >
              <div className={`style-preview ${style.id}`}>
                <div className="preview-button">Link</div>
              </div>
              <span>{style.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Font Section */}
      <section className="appearance-section">
        <h3>Font</h3>
        <div className="fonts-grid">
          {FONTS.map((font) => (
            <button
              key={font}
              className={`font-card ${profile?.fontFamily === font ? 'active' : ''}`}
              onClick={() => handleChange('fontFamily', font)}
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}


