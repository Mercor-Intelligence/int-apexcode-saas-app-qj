import { Link } from 'react-router-dom';
import { Link2, Palette, BarChart3, Zap, ArrowRight, Check } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const features = [
    {
      icon: <Link2 size={24} />,
      title: 'One Link for Everything',
      description: 'Share all your important links in one beautiful page'
    },
    {
      icon: <Palette size={24} />,
      title: 'Fully Customizable',
      description: 'Choose from themes, colors, fonts, and button styles'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Powerful Analytics',
      description: 'Track views, clicks, referrers, and more'
    },
    {
      icon: <Zap size={24} />,
      title: 'Lightning Fast',
      description: 'Optimized for instant loading on any device'
    }
  ];

  return (
    <div className="landing">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="landing-bg-gradient" />
        <div className="landing-bg-grid" />
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="landing-nav">
            <Link to="/" className="landing-logo">
              <div className="logo-icon">B</div>
              <span>BioLink</span>
            </Link>
            <nav className="landing-nav-links">
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/signup" className="btn btn-primary">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title animate-slide-up">
              Everything you are.
              <span className="gradient-text"> In one simple link.</span>
            </h1>
            <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Join millions of creators sharing their content, growing their audience, 
              and building their brand with BioLink.
            </p>
            <div className="hero-cta animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/signup" className="btn btn-primary btn-lg">
                Claim your BioLink
                <ArrowRight size={20} />
              </Link>
              <p className="hero-note">Free forever. No credit card required.</p>
            </div>
          </div>
          
          {/* Preview mockup */}
          <div className="hero-preview animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="preview-phone">
              <div className="preview-screen">
                <div className="preview-avatar" />
                <div className="preview-name">@yourname</div>
                <div className="preview-bio">Creator & Designer</div>
                <div className="preview-links">
                  <div className="preview-link">My Portfolio</div>
                  <div className="preview-link">Shop My Merch</div>
                  <div className="preview-link">Latest Video</div>
                  <div className="preview-link">Follow Me</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="container">
          <h2 className="section-title">Why choose BioLink?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="feature-card animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to get started?</h2>
            <p>Create your BioLink page in under a minute.</p>
            <ul className="cta-benefits">
              <li><Check size={18} /> Free forever plan</li>
              <li><Check size={18} /> No credit card required</li>
              <li><Check size={18} /> Set up in seconds</li>
            </ul>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create your BioLink
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="landing-logo">
                <div className="logo-icon">B</div>
                <span>BioLink</span>
              </div>
              <p>The link-in-bio platform for creators.</p>
            </div>
            <div className="footer-links">
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Support</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} BioLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


