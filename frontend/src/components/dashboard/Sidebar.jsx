import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { adminLinks, dashboardLinks, siteBrand } from '../../data/siteData.js'
import AdminIcon from '../admin/AdminIcon.jsx'
import logoImg from '../../assets/logo.png' 

function Sidebar({ role = 'user' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const links = role === 'admin' ? adminLinks : dashboardLinks

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    navigate('/')
  }

  return (
    <aside className={`sidebar ${role === 'admin' ? 'admin-sidebar' : ''}`}>
      <div className="sidebar-brand">
        <img src={logoImg} alt="PK Business Solution logo" className="brand-logo" />
        <div>
          <small>{role === 'admin' ? 'Client Portal Admin' : 'Client Portal'}</small>
          {role === 'admin' ? <span className="role-chip admin sidebar-role-chip">ADMIN</span> : user?.name ? <small>{user.name}</small> : null}
        </div>
      </div>

      <button
        aria-controls="dashboard-sidebar-menu"
        aria-expanded={isMenuOpen}
        className="sidebar-menu-toggle"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <span aria-hidden="true" className="sidebar-menu-toggle-icon">
          <span />
          <span />
          <span />
        </span>
        <span>{isMenuOpen ? 'Close menu' : 'Menu'}</span>
      </button>

      <div className={`sidebar-menu ${isMenuOpen ? 'is-open' : ''}`} id="dashboard-sidebar-menu">
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              to={link.to}
            >
              {link.icon ? (
                <span className="sidebar-link-icon">
                  <AdminIcon name={link.icon} size={16} />
                </span>
              ) : null}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="button button-primary button-compact sidebar-logout"
          onClick={handleLogout}
          type="button"
        >
          {role === 'admin' ? (
            <span className="sidebar-link-icon">
              <AdminIcon name="logout" size={16} />
            </span>
          ) : null}
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
