import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { 
  Instagram, Twitter, Youtube, Github, Linkedin, Mail, 
  Globe, Music, Facebook, ExternalLink, Sparkles
} from 'lucide-react'
import './PublicProfile.css'

const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  email: Mail,
  website: Globe,
  tiktok: Music,
  facebook: Facebook,
}

const THEMES = {
  default: {
    name: 'Sunset',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    cardHover: 'rgba(255, 255, 255, 1)',
    cardBorder: 'rgba(255, 255, 255, 0.3)',
    text: '#1a1a2e',
    textSecondary: '#4a4a6a',
    accent: '#764ba2',
  },
  ocean: {
    name: 'Ocean',
    bg: 'linear-gradient(135deg, #0c1445 0%, #1a4a6e 50%, #2d8c9e 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    cardHover: 'rgba(255, 255, 255, 1)',
    cardBorder: 'rgba(100, 255, 218, 0.3)',
    text: '#0c1445',
    textSecondary: '#1a4a6e',
    accent: '#2d8c9e',
  },
  forest: {
    name: 'Forest',
    bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    cardHover: 'rgba(255, 255, 255, 1)',
    cardBorder: 'rgba(134, 239, 172, 0.3)',
    text: '#134e5e',
    textSecondary: '#2d6a4f',
    accent: '#40916c',
  },
  sunset: {
    name: 'Violet',
    bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    cardHover: 'rgba(255, 255, 255, 1)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
    text: '#2d3436',
    textSecondary: '#636e72',
    accent: '#e84393',
  },
  minimal: {
    name: 'Light',
    bg: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
    card: 'rgba(255, 255, 255, 1)',
    cardHover: 'rgba(255, 255, 255, 1)',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    text: '#1a1a1a',
    textSecondary: '#666666',
    accent: '#000000',
  },
}

export default function PublicProfile() {
  const { handle } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [handle])

  const fetchProfile = async () => {
    try {
      const data = await api.get(`/public/${handle}`)
      setProfile(data)
      
      // Track page view
      const device = /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      const referrer = document.referrer || 'Direct'
      api.post(`/public/${handle}/view`, { device, referrer }).catch(() => {})
    } catch (err) {
      setError('Profile not found')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkClick = async (link) => {
    const device = /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    const referrer = document.referrer || 'Direct'
    
    api.post(`/public/click/${link.id}`, { device, referrer }).catch(() => {})
    
    if (link.url) {
      window.open(link.url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="public-loading">
        <div className="loading-spinner">
          <Sparkles className="spinner-icon" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-error">
        <div className="error-content">
          <h1>404</h1>
          <p>This profile doesn't exist yet.</p>
          <a href="/" className="claim-btn">Claim this handle</a>
        </div>
      </div>
    )
  }

  const theme = THEMES[profile.theme] || THEMES.default

  return (
    <div 
      className="public-profile"
      style={{ 
        '--theme-bg': theme.bg,
        '--card-bg': theme.card,
        '--card-hover': theme.cardHover,
        '--card-border': theme.cardBorder,
        '--text-color': theme.text,
        '--text-secondary': theme.textSecondary,
        '--accent-color': theme.accent,
        fontFamily: profile.fontFamily || 'DM Sans, sans-serif',
      }}
    >
      {/* Animated Background */}
      <div className="profile-bg">
        <div className="bg-gradient"></div>
        <div className="bg-blur-1"></div>
        <div className="bg-blur-2"></div>
        <div className="bg-pattern"></div>
      </div>

      <div className="profile-container">
        {/* Avatar with glow effect */}
        <div className="avatar-wrapper">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.bioTitle} 
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {profile.handle?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="avatar-ring"></div>
        </div>

        {/* Profile Info */}
        <div className="profile-info">
          <h1 className="profile-title">{profile.bioTitle || `@${profile.handle}`}</h1>
          <p className="profile-handle">@{profile.handle}</p>
          {profile.bioDescription && (
            <p className="profile-bio">{profile.bioDescription}</p>
          )}
        </div>

        {/* Links */}
        <div className="profile-links">
          {profile.links?.map((link, index) => {
            if (link.type === 'HEADER') {
              return (
                <div 
                  key={link.id} 
                  className="link-header"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  {link.title}
                </div>
              )
            }

            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`link-button ${profile.buttonStyle || 'rounded'}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {link.thumbnailUrl && (
                  <img src={link.thumbnailUrl} alt="" className="link-thumbnail" />
                )}
                <span className="link-title">{link.title}</span>
                <ExternalLink size={16} className="link-arrow" />
              </button>
            )
          })}
        </div>

        {/* Social Icons */}
        {profile.socialIcons?.length > 0 && (
          <div className="profile-socials">
            {profile.socialIcons.map((icon, index) => {
              const IconComponent = SOCIAL_ICONS[icon.platform] || Globe
              return (
                <a
                  key={icon.id}
                  href={icon.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  title={icon.platform}
                  style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                >
                  <IconComponent size={20} />
                </a>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="profile-footer">
          <a href="/" className="biolink-badge">
            <span className="badge-logo">B</span>
            <span className="badge-text">BioLink</span>
          </a>
        </footer>
      </div>
    </div>
  )
}
