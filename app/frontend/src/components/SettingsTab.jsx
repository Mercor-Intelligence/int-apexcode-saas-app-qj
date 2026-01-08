import { useState } from 'react'
import { api } from '../utils/api'
import { Plus, Trash2, Instagram, Twitter, Youtube, Github, Linkedin, Mail, Globe, Music, Facebook } from 'lucide-react'
import './SettingsTab.css'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'tiktok', label: 'TikTok', icon: Music },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'website', label: 'Website', icon: Globe },
]

export default function SettingsTab({ profile, socialIcons, setSocialIcons, onUpdate }) {
  const [saving, setSaving] = useState(false)
  const [newIcon, setNewIcon] = useState({ platform: '', url: '' })
  const [showAddIcon, setShowAddIcon] = useState(false)

  const handleSEOChange = async (field, value) => {
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

  const handleAddIcon = async (e) => {
    e.preventDefault()
    if (!newIcon.platform || !newIcon.url) return

    try {
      const icon = await api.post('/social', newIcon)
      setSocialIcons([...socialIcons, icon])
      setNewIcon({ platform: '', url: '' })
      setShowAddIcon(false)
    } catch (error) {
      console.error('Failed to add icon:', error)
    }
  }

  const handleDeleteIcon = async (id) => {
    try {
      await api.delete(`/social/${id}`)
      setSocialIcons(socialIcons.filter(i => i.id !== id))
    } catch (error) {
      console.error('Failed to delete icon:', error)
    }
  }

  const getPlatformIcon = (platformId) => {
    const platform = PLATFORMS.find(p => p.id === platformId)
    return platform?.icon || Globe
  }

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <div>
          <h2>Settings</h2>
          <p>Configure SEO and social links</p>
        </div>
        {saving && <span className="saving-indicator">Saving...</span>}
      </div>

      {/* SEO Section */}
      <section className="settings-section">
        <h3>SEO Settings</h3>
        <p className="section-description">
          Customize how your profile appears in search results and when shared
        </p>

        <div className="form-row">
          <div className="input-group">
            <label>Meta Title</label>
            <input
              type="text"
              value={profile?.metaTitle || ''}
              onChange={(e) => handleSEOChange('metaTitle', e.target.value)}
              placeholder={profile?.bioTitle || 'Your profile title'}
              className="input"
              maxLength={60}
            />
            <span className="input-hint">Appears as the page title in search results</span>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Meta Description</label>
            <textarea
              value={profile?.metaDescription || ''}
              onChange={(e) => handleSEOChange('metaDescription', e.target.value)}
              placeholder="A brief description of your profile..."
              className="input textarea"
              maxLength={160}
              rows={3}
            />
            <span className="input-hint">Appears as the description in search results (max 160 characters)</span>
          </div>
        </div>
      </section>

      {/* Social Icons Section */}
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h3>Social Icons</h3>
            <p className="section-description">
              Add social media icons to the bottom of your profile
            </p>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddIcon(true)}
          >
            <Plus size={16} />
            Add Icon
          </button>
        </div>

        {socialIcons.length === 0 && !showAddIcon ? (
          <div className="empty-icons">
            <p>No social icons added yet</p>
          </div>
        ) : (
          <div className="social-icons-list">
            {socialIcons.map((icon) => {
              const IconComponent = getPlatformIcon(icon.platform)
              return (
                <div key={icon.id} className="social-icon-item">
                  <div className="icon-preview">
                    <IconComponent size={20} />
                  </div>
                  <div className="icon-info">
                    <span className="icon-platform">
                      {PLATFORMS.find(p => p.id === icon.platform)?.label || icon.platform}
                    </span>
                    <span className="icon-url">{icon.url}</span>
                  </div>
                  <button 
                    className="delete-icon-btn"
                    onClick={() => handleDeleteIcon(icon.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {showAddIcon && (
          <form onSubmit={handleAddIcon} className="add-icon-form">
            <div className="input-group">
              <label>Platform</label>
              <select
                value={newIcon.platform}
                onChange={(e) => setNewIcon({ ...newIcon, platform: e.target.value })}
                className="input"
                required
              >
                <option value="">Select platform...</option>
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>URL</label>
              <input
                type="url"
                value={newIcon.url}
                onChange={(e) => setNewIcon({ ...newIcon, url: e.target.value })}
                placeholder="https://instagram.com/yourhandle"
                className="input"
                required
              />
            </div>
            <div className="add-icon-actions">
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddIcon(false)
                  setNewIcon({ platform: '', url: '' })
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Add Icon
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Account Section */}
      <section className="settings-section">
        <h3>Account</h3>
        <div className="account-info">
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{profile?.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Handle</span>
            <span className="info-value">@{profile?.handle}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Plan</span>
            <span className="info-value plan-badge">{profile?.planTier || 'Free'}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

