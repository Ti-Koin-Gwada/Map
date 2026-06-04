import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
import ClientMapPage from './pages/ClientMapPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { AdminProvider } from './hooks/useAdmin.js'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/map/:slug" element={<ClientMapPage />} />
        <Route path="/admin/*"   element={<AdminProvider><AdminPage /></AdminProvider>} />
        <Route path="/"          element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  if (!GOOGLE_MAPS_KEY) return <AppRoutes />
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} libraries={['places']}>
      <AppRoutes />
    </APIProvider>
  )
}
