import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CoupleProvider } from './context/CoupleContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import InvitePartnerPage from './pages/InvitePartnerPage'
import HomePage from './pages/HomePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CoupleProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/invite/:token" element={<InvitePartnerPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CoupleProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
