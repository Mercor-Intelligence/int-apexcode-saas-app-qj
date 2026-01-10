import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Instagram, Twitter, Youtube, Music, Github, Linkedin, Mail, Globe } from 'lucide-react';
import './PublicProfile.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Social icon mapping
const socialIcons = {
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  tiktok: Music,
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  website: Globe
};

export default function PublicProfile() {
  const { handle } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [handle]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/public/${handle}`);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data);
        return;
      }
      
      setProfile(data);
      
      // Track page view
      fetch(`${API_URL}/public/${handle}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrer: document.referrer })
      });
    } catch (err) {
      setError({ error: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (link) => {
    // Track click
    await fetch(`${API_URL}/public/click/${link.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer })
    });
    
    // Open link
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="public-profile loading">
        <div className="profile-loading">
          <div className="loading-avatar" />
          <div className="loading-text" />
          <div className="loading-text short" />
          <div className="loading-links">
            <div className="loading-link" />
            <div className="loading-link" />
            <div className="loading-link" />
          </div>
        </div>
      </div>
    );
  }

  // Error/404 state
  if (error) {
    return (
      <div className="public-profile error-page">
        <div className="error-content">
          <h1>404</h1>
          <p>This page doesn't exist... yet!</p>
          {error.suggestion && <p className="error-suggestion">{error.suggestion}</p>}
          <Link to="/signup" className="btn btn-primary">
            Claim @{handle}
          </Link>
        </div>
      </div>
    );
  }

  // Get theme class
  const themeClass = profile.theme || 'dark';

  return (
    <div className={`public-profile theme-${themeClass}`}>
      {/* Background */}
      <div className="profile-bg">
        <div className="profile-bg-gradient" />
        <div className="profile-bg-pattern" />
      </div>

      <div className="profile-container">
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName} 
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar placeholder">
              {(profile.displayName || profile.handle)[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <h1 className="profile-title">
          {profile.bioTitle || profile.displayName || `@${profile.handle}`}
        </h1>
        
        {profile.bioDescription && (
          <p className="profile-bio">{profile.bioDescription}</p>
        )}

        {/* Links */}
        <div className="profile-links">
          {profile.links?.map((link, index) => (
            link.type === 'HEADER' ? (
              <div 
                key={link.id} 
                className="link-header"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {link.title}
              </div>
            ) : (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`link-button ${profile.buttonStyle || 'rounded'}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {link.thumbnailUrl && (
                  <img 
                    src={link.thumbnailUrl} 
                    alt="" 
                    className="link-thumbnail"
                  />
                )}
                <span className="link-title">{link.title}</span>
                <ExternalLink size={16} className="link-arrow" />
              </button>
            )
          ))}
        </div>

        {/* Social Icons */}
        {profile.socialIcons?.length > 0 && (
          <div className="profile-social">
            {profile.socialIcons.map(icon => {
              const Icon = socialIcons[icon.platform] || Globe;
              return (
                <a
                  key={icon.id}
                  href={icon.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  title={icon.platform}
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        )}

        {/* Badge for free users */}
        {profile.showBadge && (
          <a href="/" className="biolink-badge">
            <span>Powered by</span>
            <strong>BioLink</strong>
          </a>
        )}
      </div>
    </div>
  );
}

