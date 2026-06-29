import { useNavigate } from 'react-router-dom'
import '../styles/login.css'

function ForgotPasswordScreen() {
  const navigate = useNavigate()

  return (
    <div className="login-container">

      <div className="login-left">

        <h1 className="login-logo">SANJan</h1>

        <h2 className="welcome-text">Reset Password</h2>

        <p className="subtitle">
          Enter your email and we’ll send a reset link.
        </p>

        <input type="text" placeholder="Email Address" className="login-input" />

        <button className="login-button">
          Send Reset Link
        </button>

        <p className="signup-text">
          Remember your password?
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

        <h2>Recover Access</h2>
        <p>We’ll help you get back into your account safely.</p>

      </div>

    </div>
  )
}

export default ForgotPasswordScreen