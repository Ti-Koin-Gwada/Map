import { NavLink, useNavigate } from 'react-router-dom'
import { MapPin, Map, LogOut } from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin.js'

function LeafMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M20 3.5 C9 3 3.2 9 3.2 16.5 C3.2 18.6 3.8 20.4 4.6 21.6 C5.8 20.4 6.6 19 7.2 17.4 C9 19 12 18.8 14.6 16.8 C19.4 13 20.6 7 20 3.5 Z" fill="var(--color-forest)" />
      <path d="M5.4 20.6 C7.6 14 11.6 9.4 17.4 6.8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function SidebarItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${isActive
          ? 'bg-[rgba(45,90,61,0.09)] text-[--color-forest-dark] font-semibold'
          : 'text-[--color-text-secondary] hover:bg-[--color-border]'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <span
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              border: `1.5px solid ${isActive ? 'var(--color-forest)' : 'var(--color-border-mid)'}`,
              background: isActive ? 'var(--color-forest)' : 'transparent',
            }}
          >
            {isActive && (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M2 5l2 2 4-5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function AdminLayout({ children }) {
  const { logout } = useAdmin()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin', { replace: true })
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col py-6 px-4"
        style={{ borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-7">
          <LeafMark />
          <span
            className="font-serif italic font-semibold text-lg"
            style={{ color: 'var(--color-forest-dark)' }}
          >
            Ti Koin Gwada
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <SidebarItem to="/admin/spots"  icon={MapPin} label="Mes spots"  />
          <SidebarItem to="/admin/cartes" icon={Map}    label="Mes cartes" />
        </nav>

        {/* Pied de sidebar */}
        <div
          className="mt-auto pt-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#E8E2CF,#D0DDD0)', border: '1px solid var(--color-border-mid)' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-forest-dark)' }}>Flo</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs transition-opacity opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <LogOut size={14} />
            Déco
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {children}
      </main>
    </div>
  )
}
