import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import LinksTab from '../components/LinksTab'
import AppearanceTab from '../components/AppearanceTab'
import AnalyticsTab from '../components/AnalyticsTab'
import SettingsTab from '../components/SettingsTab'
import ProfilePreview from '../components/ProfilePreview'
import { Link2, Palette, BarChart3, Settings, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [socialIcons, setSocialIcons] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await api.get('/profile')
      setProfile(data)
      setLinks(data.links || [])
      setSocialIcons(data.socialIcons || [])
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleProfileUpdate = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }))
    updateUser(updates)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">B</div>
            <span>BioLink</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end onClick={() => setMobileMenuOpen(false)}>
            <Link2 size={20} />
            Links
          </NavLink>
          <NavLink to="/dashboard/appearance" onClick={() => setMobileMenuOpen(false)}>
            <Palette size={20} />
            Appearance
          </NavLink>
          <NavLink to="/dashboard/analytics" onClick={() => setMobileMenuOpen(false)}>
            <BarChart3 size={20} />
            Analytics
          </NavLink>
          <NavLink to="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
            <Settings size={20} />
            Settings
          </NavLink>
        </nav>
        
        <div className="sidebar-footer">
          <a 
            href={`/${user?.handle}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-profile-btn"
          >
            <ExternalLink size={18} />
            View my BioLink
          </a>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="header-user">
            <span className="header-handle">@{user?.handle}</span>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="header-avatar" />
            ) : (
              <div className="header-avatar-placeholder">
                {user?.handle?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <button className="mobile-preview-btn" onClick={() => setMobilePreviewOpen(true)}>
            Preview
          </button>
        </header>

        <div className="dashboard-content">
          <Routes>
            <Route 
              index 
              element={
                <LinksTab 
                  links={links} 
                  setLinks={setLinks} 
                />
              } 
            />
            <Route 
              path="appearance" 
              element={
                <AppearanceTab 
                  profile={profile} 
                  onUpdate={handleProfileUpdate}
                />
              } 
            />
            <Route path="analytics" element={<AnalyticsTab />} />
            <Route 
              path="settings" 
              element={
                <SettingsTab 
                  profile={profile}
                  socialIcons={socialIcons}
                  setSocialIcons={setSocialIcons}
                  onUpdate={handleProfileUpdate}
                />
              } 
            />
          </Routes>
        </div>
      </main>

      {/* Live Preview */}
      <aside className={`dashboard-preview ${mobilePreviewOpen ? 'open' : ''}`}>
        <div className="preview-header">
          <h3>Live Preview</h3>
          <button className="mobile-close" onClick={() => setMobilePreviewOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <ProfilePreview 
          profile={profile}
          links={links}
          socialIcons={socialIcons}
        />
      </aside>

      {/* Mobile Overlay */}
      {(mobileMenuOpen || mobilePreviewOpen) && (
        <div 
          className="mobile-overlay" 
          onClick={() => {
            setMobileMenuOpen(false)
            setMobilePreviewOpen(false)
          }}
        />
      )}
    </div>
  )
}

