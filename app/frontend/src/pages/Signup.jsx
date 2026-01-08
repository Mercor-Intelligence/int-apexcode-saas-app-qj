import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { Check, X, ChevronRight, ArrowLeft } from 'lucide-react'
import './Auth.css'

const CATEGORIES = [
  { id: 'creator', label: 'Creator', emoji: '🎨' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'food', label: 'Food & Lifestyle', emoji: '🍕' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

export default function Signup() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [handle, setHandle] = useState(searchParams.get('handle') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [category, setCategory] = useState('')
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (handle) {
      checkHandle(handle)
    }
  }, [])

  const checkHandle = async (value) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setHandle(cleaned)
    
    if (cleaned.length < 2) {
      setAvailability(null)
      return
    }
    
    setChecking(true)
    try {
      const result = await api.get(`/auth/check-handle/${cleaned}`)
      setAvailability(result)
    } catch {
      setAvailability(null)
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (step === 1 && availability?.available) {
      setStep(2)
      return
    }
    
    if (step === 2 && email && password) {
      setStep(3)
      return
    }
    
    if (step === 3 && category) {
      setLoading(true)
      try {
        await signup({ handle, email, password, category })
        navigate('/dashboard')
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-gradient"></div>
      </div>
      
      <div className="auth-container">
        <Link to="/" className="auth-back">
          <ArrowLeft size={20} />
          Back
        </Link>
        
        <div className="auth-card animate-scaleIn">
          <div className="auth-header">
            <Link to="/" className="logo">
              <div className="logo-icon">B</div>
            </Link>
            <h1>Create your BioLink</h1>
            <p>Join millions of creators worldwide</p>
          </div>
          
          {/* Progress Steps */}
          <div className="auth-steps">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Handle</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Account</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Category</span>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Step 1: Handle */}
            {step === 1 && (
              <div className="step-content animate-fadeIn">
                <div className="input-group">
                  <label>Choose your unique handle</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">biolink.com/</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => checkHandle(e.target.value)}
                      placeholder="yourname"
                      className="input"
                      maxLength={30}
                      autoFocus
                    />
                  </div>
                  {handle && (
                    <div className={`handle-feedback ${checking ? '' : availability?.available ? 'success' : 'error'}`}>
                      {checking ? (
                        <span className="checking">Checking availability...</span>
                      ) : availability?.available ? (
                        <span className="available"><Check size={16} /> This handle is available!</span>
                      ) : (
                        <span className="taken"><X size={16} /> This handle is taken</span>
                      )}
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-full"
                  disabled={!handle || !availability?.available}
                >
                  Continue
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Step 2: Email & Password */}
            {step === 2 && (
              <div className="step-content animate-fadeIn">
                <div className="input-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Create a password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="input"
                    minLength={8}
                    required
                  />
                </div>
                
                <div className="auth-actions">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-ghost">
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!email || password.length < 8}
                  >
                    Continue
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Category */}
            {step === 3 && (
              <div className="step-content animate-fadeIn">
                <div className="input-group">
                  <label>What best describes you?</label>
                  <div className="category-grid">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`category-btn ${category === cat.id ? 'selected' : ''}`}
                      >
                        <span className="category-emoji">{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="auth-actions">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-ghost">
                    <ArrowLeft size={18} />
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!category || loading}
                  >
                    {loading ? 'Creating...' : 'Create my BioLink'}
                    {!loading && <ChevronRight size={20} />}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

