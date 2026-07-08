import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/splash.css'

function SplashScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/MainScreen')
    }, 1500)

    return () => clearTimeout(timer)
  }, [navigate])

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
