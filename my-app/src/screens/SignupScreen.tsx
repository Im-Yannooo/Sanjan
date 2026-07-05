import { useNavigate } from 'react-router-dom'
import '../styles/login.css'

function SignupScreen() {
  const navigate = useNavigate()

  return (
    <div className="login-container">

      <div className="login-left">

        <h1 className="login-logo">SANJan</h1>

        <h2 className="welcome-text">Create Account</h2>

        <p className="subtitle">
          Sign up to start building your knowledge network.
        </p>

        <input type="text" placeholder="Username" className="login-input" />
        <input type="text" placeholder="Email" className="login-input" />
        <input type="password" placeholder="Password" className="login-input" />
        <input type="password" placeholder="Confirm Password" className="login-input" />

        <div className="login-options">
          <label>
            <input type="checkbox" />
            I agree to Terms & Conditions
          </label>
        </div>

        <button
            className="login-button"
            onClick={() => navigate('/MainScreen')}
          >
            Sign Up
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