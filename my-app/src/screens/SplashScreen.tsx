import '../styles/splash.css'

function SplashScreen() {
  return (
    <div className="splash-container">
      <div className="splash-content">
        <h1 className="app-title">SANJan</h1>

        <p className="tagline">
          Connect Ideas. Build Knowledge.
        </p>

        <div className="loader"></div>

        <p className="loading-text">
          Loading...
        </p>
      </div>
    </div>
  )
}

export default SplashScreen
