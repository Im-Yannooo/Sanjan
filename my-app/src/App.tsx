import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { TabProvider } from './context/TabContext'
import TitleBar from './components/CustomTitleBar'
import SplashScreen from './screens/SplashScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import MainScreen from './screens/MainScreen'
import ObsidianFeaturesScreen from './screens/ObsidianFeaturesScreen'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/MainScreen" element={<MainScreen />} />
      <Route path="/ObsidianFeaturesScreen" element={<ObsidianFeaturesScreen />} />
    </Routes>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <BrowserRouter>
      <TabProvider>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <TitleBar />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {showSplash ? <SplashScreen /> : <AppRoutes />}
          </div>
        </div>
      </TabProvider>
    </BrowserRouter>
  )
}

export default App