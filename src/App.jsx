import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ClientMapPage from './pages/ClientMapPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/map/:slug" element={<ClientMapPage />} />
        <Route path="/admin/*"   element={<AdminPage />} />
        <Route path="/"          element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
