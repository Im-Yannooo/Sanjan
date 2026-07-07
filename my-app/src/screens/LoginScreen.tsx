import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/login.css'

function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5123/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed')
        return
      }

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('email', data.email)

      navigate('/MainScreen')

    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">

      <div className="login-left">

        <h1 className="login-logo">SANJan</h1>

        <h2 className="welcome-text">Welcome Back</h2>

        <p className="subtitle">
          Sign in to continue building your knowledge network.
        </p>

        <input
          type="text"
          placeholder="Email or Username"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <div className="login-options">
          <label>
            <input type="checkbox" />
            Remember Me
          </label>

          <a onClick={() => navigate('/forgot-password')}>
            Forgot Password?
          </a>
        </div>

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="signup-text">
          Don't have an account?
          <span onClick={() => navigate('/signup')}>
            {' '}Sign Up
          </span>
        </p>

      </div>

      <div className="login-right">
        <div className="graph-container">
          <div className="node node1"></div>
          <div className="node node2"></div>
          <div className="node node3"></div>
          <div className="node node4"></div>
          <div className="node node5"></div>

          <div className="line line1"></div>
          <div className="line line2"></div>
          <div className="line line3"></div>
          <div className="line line4"></div>
        </div>

        <h2>Connect Ideas</h2>
        <p>Discover relationships between notes and build a second brain.</p>
      </div>

    </div>
  )
}

export default LoginScreen