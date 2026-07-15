import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TabProvider } from './context/TabContext'

import TitleBar from './components/CustomTitleBar'
import GraphView from './components/GraphView'

import SetupScreen from './screens/SetupScreen'
import SplashScreen from './screens/SplashScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import MainScreen from './screens/MainScreen'
import SettingsScreen from './screens/SettingsScreen'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/MainScreen" element={<MainScreen />} />
      <Route path="/GraphView" element={<GraphView />} />
      <Route path="/settings" element={<SettingsScreen />} />
    </Routes>
  )
}

// Toggle to skip SetupScreen during development. Set to false for production.
const SKIP_SETUP = false;

function App() {
  const [vaultConfigured, setVaultConfigured] = useState<boolean | null>(null)
  
  useEffect(() => {
    async function initialize() {
      if (SKIP_SETUP) {
        setVaultConfigured(true);
        return;
      }
      const config = await window.electronAPI.config.getConfig();
      setVaultConfigured(config.vaultPath !== null);
    }
    initialize();
  }, [])

  const handleVaultConfigured = () => {
    setVaultConfigured(true);
    window.electronAPI.window.setLoginSize();
  }

  if (vaultConfigured === null) {
    return null;
  }

  if (vaultConfigured === false) {
    return (
      <SetupScreen onVaultConfigured={handleVaultConfigured} />
    )
  }

  return (
    <BrowserRouter>
      <TabProvider>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh'
          }}
        >
          <TitleBar />
          <div
            style={{
              flex: 1,
              overflow: 'hidden'
            }}
          >
            <AppRoutes />
          </div>
        </div>
      </TabProvider>
    </BrowserRouter>
  )
}

export default App