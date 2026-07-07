import { useNavigate } from 'react-router-dom'
import '../styles/SettingsScreen.css'

function SettingsScreen() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out?'
    )

    if (confirmed) {
      navigate('/login')
    }
  }

  return (
    <div className="settings-container">

      <div className="settings-header">

        <div>
          <h1>Settings</h1>
          <p>Manage your SANJan account</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate('/MainScreen')}
        >
          ← Back to Notes
        </button>

      </div>

      <div className="settings-grid">

        {/* Profile */}

        <div className="settings-card">

          <h2>Profile</h2>

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
          />

          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
          />

          <button className="save-btn">
            Save Profile
          </button>

        </div>

        {/* Security */}

        <div className="settings-card">

          <h2>Security</h2>

          <label>Current Password</label>
          <input
            type="password"
            placeholder="Current password"
          />

          <label>New Password</label>
          <input
            type="password"
            placeholder="New password"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
          />

          <button className="save-btn">
            Change Password
          </button>

        </div>

        {/* Account */}

        <div className="settings-card">

          <h2>Account</h2>

          <p>
            Sign out of your SANJan account.
          </p>

          <button
            className="danger-btn"
            onClick={handleSignOut}
          >
            Sign Out
          </button>

        </div>

      </div>

    </div>
  )
}

export default SettingsScreen