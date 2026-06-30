import { useNavigate } from 'react-router-dom'
import '../styles/login.css'

function LoginScreen() {
  const navigate = useNavigate()

  return (
    <div className="login-container">

      <div className="login-left">

        <h1 className="login-logo">SANJan</h1>

        <h2 className="welcome-text">Welcome Back</h2>

        <p className="subtitle">
          Sign in to continue building your knowledge network.
        </p>

        <input type="text" placeholder="Email or Username" className="login-input" />
        <input type="password" placeholder="Password" className="login-input" />

        <div className="login-options">
          <label>
            <input type="checkbox" />
            Remember Me
          </label>

          <a onClick={() => navigate('/forgot-password')}>
            Forgot Password?
          </a>
        </div>

        <button className="login-button" onClick={() => navigate('/ObsidianFeaturesScreen')}>
          Sign In
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