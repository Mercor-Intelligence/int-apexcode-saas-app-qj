import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { Link2, BarChart3, Palette, Zap, ChevronRight, Check, X } from 'lucide-react'
import './Landing.css'

export default function Landing() {
  const [handle, setHandle] = useState('')
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState(null)
  const navigate = useNavigate()

  const checkHandle = async (value) => {
    setHandle(value)
    if (value.length < 2) {
      setAvailability(null)
      return
    }
    
    setChecking(true)
    try {
      const result = await api.get(`/auth/check-handle/${value}`)
      setAvailability(result)
    } catch (error) {
      setAvailability(null)
    } finally {
      setChecking(false)
    }
  }

  const handleClaim = (e) => {
    e.preventDefault()
    if (handle && availability?.available) {
      navigate(`/signup?handle=${handle}`)
    }
  }

  return (
    <div className="landing">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
        <div className="bg-glow"></div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <Link to="/" className="logo">
          <div className="logo-icon">B</div>
          <span>BioLink</span>
        </Link>
        <nav className="landing-nav">
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-slideUp">
            One Link for
            <span className="text-gradient"> Everything</span>
          </h1>
          <p className="hero-subtitle animate-slideUp stagger-1">
            Create a beautiful landing page to share all your content, social links, 
            and digital products. Join millions of creators.
          </p>
          
          <form className="handle-form animate-slideUp stagger-2" onSubmit={handleClaim}>
            <div className="handle-input-wrapper">
              <span className="handle-prefix">biolink.com/</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => checkHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="yourname"
                className="handle-input"
                maxLength={30}
              />
              {handle && (
                <span className={`handle-status ${checking ? 'checking' : availability?.available ? 'available' : 'taken'}`}>
                  {checking ? (
                    <div className="mini-loader"></div>
                  ) : availability?.available ? (
                    <Check size={18} />
                  ) : (
                    <X size={18} />
                  )}
                </span>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={!handle || !availability?.available}>
              Claim your link
              <ChevronRight size={20} />
            </button>
          </form>
          
          {availability && !availability.available && availability.suggestions && (
            <div className="handle-suggestions animate-fadeIn">
              <span>Try: </span>
              {availability.suggestions.map(s => (
                <button key={s} onClick={() => checkHandle(s)} className="suggestion-btn">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hero-preview animate-scaleIn stagger-3">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="preview-avatar"></div>
              <div className="preview-name">@yourname</div>
              <div className="preview-bio">Creator • Artist • Dreamer</div>
              <div className="preview-links">
                <div className="preview-link">My Latest Project</div>
                <div className="preview-link">Watch My Videos</div>
                <div className="preview-link">Shop My Merch</div>
                <div className="preview-link">Join My Newsletter</div>
              </div>
              <div className="preview-socials">
                <div className="preview-social-icon"></div>
                <div className="preview-social-icon"></div>
                <div className="preview-social-icon"></div>
                <div className="preview-social-icon"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">Everything you need</h2>
        <div className="features-grid">
          <div className="feature-card animate-slideUp stagger-1">
            <div className="feature-icon">
              <Link2 size={28} />
            </div>
            <h3>Unlimited Links</h3>
            <p>Add as many links as you need. Music, videos, shops, socials - all in one place.</p>
          </div>
          <div className="feature-card animate-slideUp stagger-2">
            <div className="feature-icon">
              <Palette size={28} />
            </div>
            <h3>Full Customization</h3>
            <p>Match your brand with custom themes, colors, fonts, and button styles.</p>
          </div>
          <div className="feature-card animate-slideUp stagger-3">
            <div className="feature-icon">
              <BarChart3 size={28} />
            </div>
            <h3>Deep Analytics</h3>
            <p>Track views, clicks, locations, and referrers. Know your audience.</p>
          </div>
          <div className="feature-card animate-slideUp stagger-4">
            <div className="feature-icon">
              <Zap size={28} />
            </div>
            <h3>Lightning Fast</h3>
            <p>Optimized for mobile. Your page loads in under 1.5 seconds.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-icon">B</div>
              <span>BioLink</span>
            </div>
            <p>The only link you'll ever need.</p>
          </div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Blog</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 BioLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}


