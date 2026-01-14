import { ExternalLink } from 'lucide-react';
import './ProfilePreview.css';

export default function ProfilePreview({ profile, links }) {
  const themeClass = profile?.theme || 'dark';
  
  return (
    <div className={`profile-preview theme-${themeClass}`}>
      <div className="preview-phone">
        <div className="preview-notch" />
        
        <div className="preview-content">
          {/* Avatar */}
          <div className="preview-avatar">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <div className="avatar-placeholder">
                {(profile?.displayName || profile?.handle || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Info */}
          <h3 className="preview-title">
            {profile?.bioTitle || profile?.displayName || `@${profile?.handle || 'yourname'}`}
          </h3>
          
          {profile?.bioDescription && (
            <p className="preview-bio">{profile.bioDescription}</p>
          )}
          
          {/* Links */}
          <div className="preview-links">
            {links?.filter(l => l.isActive).slice(0, 5).map((link, i) => (
              link.type === 'HEADER' ? (
                <div key={link.id} className="preview-header">{link.title}</div>
              ) : (
                <div 
                  key={link.id} 
                  className={`preview-link ${profile?.buttonStyle || 'rounded'}`}
                >
                  <span>{link.title}</span>
                  <ExternalLink size={12} />
                </div>
              )
            ))}
            
            {(!links || links.filter(l => l.isActive).length === 0) && (
              <div className="preview-link rounded placeholder">
                Your links appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

