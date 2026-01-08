import { Instagram, Twitter, Youtube, Github, Linkedin, Mail, Globe, Music, Facebook } from 'lucide-react'
import './ProfilePreview.css'

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
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    text: '#1a1a2e',
  },
  ocean: {
    bg: 'linear-gradient(135deg, #0c1445 0%, #1a4a6e 50%, #2d8c9e 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    text: '#0c1445',
  },
  forest: {
    bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    text: '#134e5e',
  },
  sunset: {
    bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
    card: 'rgba(255, 255, 255, 0.95)',
    text: '#2d3436',
  },
  minimal: {
    bg: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
    card: 'rgba(255, 255, 255, 1)',
    text: '#1a1a1a',
  },
}

export default function ProfilePreview({ profile, links, socialIcons }) {
  const theme = THEMES[profile?.theme] || THEMES.default
  const activeLinks = links?.filter(l => l.isActive) || []

  return (
    <div className="preview-frame">
      <div className="preview-notch"></div>
      <div 
        className="preview-screen"
        style={{
          '--theme-bg': theme.bg,
          '--card-bg': theme.card,
          '--text-color': theme.text,
          fontFamily: profile?.fontFamily || 'DM Sans, sans-serif',
        }}
      >
        {/* Background Effect */}
        <div className="preview-bg"></div>
        
        <div className="preview-content">
          {/* Avatar */}
          <div className="preview-avatar-wrapper">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="preview-avatar" />
            ) : (
              <div className="preview-avatar-placeholder">
                {profile?.handle?.[0]?.toUpperCase() || 'B'}
              </div>
            )}
          </div>

          {/* Bio */}
          <h3 className="preview-title">
            {profile?.bioTitle || `@${profile?.handle || 'username'}`}
          </h3>
          <p className="preview-handle">@{profile?.handle || 'username'}</p>
          {profile?.bioDescription && (
            <p className="preview-bio">{profile.bioDescription}</p>
          )}

          {/* Links */}
          <div className="preview-links">
            {activeLinks.length === 0 ? (
              <div className="preview-empty">
                <p>Your links will appear here</p>
              </div>
            ) : (
              activeLinks.map((link) => {
                if (link.type === 'HEADER') {
                  return (
                    <div key={link.id} className="preview-header">
                      {link.title}
                    </div>
                  )
                }

                return (
                  <div 
                    key={link.id} 
                    className={`preview-link ${profile?.buttonStyle || 'rounded'}`}
                  >
                    {link.title}
                  </div>
                )
              })
            )}
          </div>

          {/* Social Icons */}
          {socialIcons?.length > 0 && (
            <div className="preview-socials">
              {socialIcons.map((icon) => {
                const IconComponent = SOCIAL_ICONS[icon.platform] || Globe
                return (
                  <div key={icon.id} className="preview-social-icon">
                    <IconComponent size={14} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
