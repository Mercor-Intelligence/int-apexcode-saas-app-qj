import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Link2, Palette, BarChart3, Settings, LogOut, 
  ExternalLink, Menu, X, Share2
} from 'lucide-react';
import LinksTab from '../components/LinksTab';
import AppearanceTab from '../components/AppearanceTab';
import AnalyticsTab from '../components/AnalyticsTab';
import SettingsTab from '../components/SettingsTab';
import ProfilePreview from '../components/ProfilePreview';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchLinks();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await api.get('/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${user.handle}`;
    navigator.clipboard.writeText(profileUrl);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const profileUrl = `/${user?.handle}`;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">B</div>
            <span>BioLink</span>
          </div>
          <button 
            className="mobile-close" 
            onClick={() => setMobileMenuOpen(false)}
          >
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
            href={profileUrl} 
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

      {/* Main content */}
      <main className="dashboard-main">
        {/* Mobile header */}
        <header className="dashboard-header">
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="header-profile">
            <span className="header-handle">@{user?.handle}</span>
            <button onClick={copyProfileLink} className="share-btn">
              <Share2 size={18} />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="dashboard-content">
          <div className="content-main">
            <Routes>
              <Route index element={
                <LinksTab 
                  links={links} 
                  setLinks={setLinks} 
                  onUpdate={fetchLinks}
                />
              } />
              <Route path="appearance" element={
                <AppearanceTab 
                  profile={profile} 
                  setProfile={setProfile}
                  onUpdate={fetchProfile}
                />
              } />
              <Route path="analytics" element={<AnalyticsTab />} />
              <Route path="settings" element={
                <SettingsTab 
                  profile={profile}
                  onUpdate={fetchProfile}
                />
              } />
            </Routes>
          </div>

          {/* Preview */}
          <div className="content-preview">
            <div className="preview-header">
              <h3>Preview</h3>
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
              </a>
            </div>
            <ProfilePreview profile={profile} links={links} />
          </div>
        </div>
      </main>

      {/* Share toast */}
      {showShareToast && (
        <div className="toast">
          Link copied to clipboard!
        </div>
      )}

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}
    </div>
  );
}

