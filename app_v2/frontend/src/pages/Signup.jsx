import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { ArrowRight, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import './Auth.css';

const CATEGORIES = [
  { id: 'creative', name: 'Creative', emoji: '🎨' },
  { id: 'business', name: 'Business', emoji: '💼' },
  { id: 'tech', name: 'Tech', emoji: '💻' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'fashion', name: 'Fashion', emoji: '👗' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'food', name: 'Food', emoji: '🍕' },
  { id: 'other', name: 'Other', emoji: '✨' }
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState(null); // null, 'checking', 'available', 'taken'
  const [handleSuggestions, setHandleSuggestions] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  
  // Check handle availability
  const checkHandle = async (value) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setHandle(cleaned);
    setHandleStatus(null);
    setHandleSuggestions([]);
    
    if (cleaned.length < 3) return;
    
    setHandleStatus('checking');
    
    try {
      const response = await api.get(`/auth/check-handle/${cleaned}`);
      const data = await response.json();
      
      if (data.available) {
        setHandleStatus('available');
      } else {
        setHandleStatus('taken');
        setHandleSuggestions(data.suggestions || []);
      }
    } catch (err) {
      setHandleStatus(null);
    }
  };
  
  // Password strength check
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[strength] };
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signup(email, password, handle, category);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const canProceed = () => {
    if (step === 1) return handleStatus === 'available';
    if (step === 2) return email && getPasswordStrength().strength >= 3;
    if (step === 3) return category;
    return false;
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-gradient" />
      </div>
      
      <div className="auth-container">
        <Link to="/" className="auth-logo">
          <div className="logo-icon">B</div>
          <span>BioLink</span>
        </Link>
        
        {/* Progress */}
        <div className="auth-progress">
          {[1, 2, 3].map(s => (
            <div 
              key={s} 
              className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
            >
              {step > s ? <Check size={14} /> : s}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Step 1: Handle */}
          {step === 1 && (
            <div className="auth-step animate-fade-in">
              <h1>Claim your BioLink</h1>
              <p className="auth-subtitle">Choose a unique handle for your page</p>
              
              <div className="input-group">
                <label>Your handle</label>
                <div className="handle-input-wrapper">
                  <span className="handle-prefix">biolink.com/</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => checkHandle(e.target.value)}
                    placeholder="yourname"
                    className="input handle-input"
                    maxLength={30}
                    autoFocus
                  />
                  <div className="handle-status">
                    {handleStatus === 'checking' && <Loader2 size={18} className="spin" />}
                    {handleStatus === 'available' && <Check size={18} className="text-success" />}
                    {handleStatus === 'taken' && <AlertCircle size={18} className="text-error" />}
                  </div>
                </div>
                
                {handleStatus === 'taken' && handleSuggestions.length > 0 && (
                  <div className="handle-suggestions">
                    <span>Try: </span>
                    {handleSuggestions.map(s => (
                      <button 
                        key={s} 
                        type="button"
                        onClick={() => checkHandle(s)}
                        className="suggestion-btn"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="btn btn-primary btn-full"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          
          {/* Step 2: Email & Password */}
          {step === 2 && (
            <div className="auth-step animate-fade-in">
              <button type="button" onClick={() => setStep(1)} className="back-btn">
                <ArrowLeft size={18} />
                Back
              </button>
              
              <h1>Create your account</h1>
              <p className="auth-subtitle">Enter your email and create a password</p>
              
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  autoFocus
                />
              </div>
              
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="input"
                />
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill strength-${getPasswordStrength().strength}`}
                        style={{ width: `${getPasswordStrength().strength * 25}%` }}
                      />
                    </div>
                    <span className={`strength-label strength-${getPasswordStrength().strength}`}>
                      {getPasswordStrength().label}
                    </span>
                  </div>
                )}
                <p className="input-hint">
                  Min 8 characters, one uppercase, one lowercase, one number
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="btn btn-primary btn-full"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          
          {/* Step 3: Category */}
          {step === 3 && (
            <div className="auth-step animate-fade-in">
              <button type="button" onClick={() => setStep(2)} className="back-btn">
                <ArrowLeft size={18} />
                Back
              </button>
              
              <h1>What describes you best?</h1>
              <p className="auth-subtitle">This helps us personalize your experience</p>
              
              <div className="category-grid">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`category-btn ${category === cat.id ? 'active' : ''}`}
                  >
                    <span className="category-emoji">{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
              
              {error && (
                <div className="auth-error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={!canProceed() || loading}
                className="btn btn-primary btn-full"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create my BioLink
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

