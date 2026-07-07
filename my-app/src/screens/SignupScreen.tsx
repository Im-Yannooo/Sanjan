import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/login.css'

function SignupScreen() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setError('')

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5123/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          displayName: username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed.')
        return
      }

      navigate('/login')

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

        <h2 className="welcome-text">Create Account</h2>

        <p className="subtitle">
          Sign up to start building your knowledge network.
        </p>

        <input
          type="text"
          placeholder="Username"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Email"
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
        <input
          type="password"
          placeholder="Confirm Password"
          className="login-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>
            {error}
          </p>
        )}

        <div className="login-options">
          <label>
            <input type="checkbox" />
            I agree to Terms & Conditions
          </label>
        </div>

        <button
          className="login-button"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="signup-text">
          Already have an account?
          <span onClick={() => navigate('/login')}>
            {' '}Sign In
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

        <h2>Build Your Second Brain</h2>
        <p>Organize ideas, connect thoughts, and grow your knowledge system.</p>
      </div>

    </div>
  )
}

export default SignupScreen