import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../../shared/theme/ThemeProvider";
import { useAuth } from "../../shared/auth/useAuth";
import {
  Home, BookOpen, FileText, FolderGit2, User, Package, Phone,
  Menu, X, Terminal, Sun, Moon, ChevronDown, LogOut, Settings
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/courses", label: "Cursos", icon: BookOpen },
  { to: "/tutorials", label: "Tutoriales", icon: FileText },
  { to: "/projects", label: "Proyectos", icon: FolderGit2 },
  { to: "/about", label: "Sobre mí", icon: User },
  { to: "/resources", label: "Recursos", icon: Package },
  { to: "/contact", label: "Contacto", icon: Phone },
];

export default function TopNav() {
  const { theme, toggle } = useTheme();
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const authed = status === "authenticated";

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  return (
    <header className="site-header">
      {/* Barra superior: logo */}
      <div className="header-brand">
        <div className="brand-inner">
          <Link to="/" className="brand-logo" onClick={() => setOpen(false)}>
            <div className="brand-icon">
              <Terminal size={22} />
            </div>
            <div>
              <div className="brand-name">Francisco Higuera</div>
              <div className="brand-sub">Software Developer · Educator</div>
            </div>
          </Link>

          <div className="header-right">
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="mobile-menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              {open ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Barra de navegación desktop */}
      <nav className="nav-bar">
        <div className="nav-inner">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-btn ${isActive ? "nav-btn--active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Auth (usuario logueado) */}
          {authed ? (
            <div className="user-profile-section">
              <div className="user-avatar-container">
                <button
                  className="user-avatar-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="User menu"
                >
                  <div className="user-avatar">
                    {user?.first_name || user?.email ? (
                      <img
                        src="/images/francisco-higuera-photo.jpg" // Reemplaza con tu foto real
                        alt={`${user?.first_name} ${user?.last_name}`}
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (target && fallback) {
                            target.style.display = 'none';
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className="user-avatar-fallback">
                      {getUserInitials()}
                    </div>
                  </div>
                  <ChevronDown size={14} className="user-avatar-chevron" />
                </button>

                {/* Dropdown del perfil */}
                {profileOpen && (
                  <div className="user-profile-dropdown">
                    <div className="user-profile-info">
                      <div className="user-profile-avatar">
                        <img
                          src="/images/francisco-higuera-photo.jpg" // Reemplaza con tu foto real
                          alt={`${user?.first_name} ${user?.last_name}`}
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (target && fallback) {
                              target.style.display = 'none';
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="user-profile-avatar-fallback">
                          {getUserInitials()}
                        </div>
                      </div>
                      <div className="user-profile-details">
                        <div className="user-profile-name">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="user-profile-email">
                          {user?.email}
                        </div>
                        <div className="user-profile-role">
                          {user?.role?.name || 'Usuario'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="user-profile-menu">
                      <Link
                        to="/profile"
                        className="user-profile-menu-item"
                        onClick={() => setProfileOpen(false)}
                      >
                        <User size={16} />
                        Mi Perfil
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="user-profile-menu-item"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings size={16} />
                        Configuración
                      </Link>
                      
                      <button
                        className="user-profile-menu-item user-profile-menu-logout"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-btn ${isActive ? "nav-btn--active" : ""}`}
              >
                <span>Login</span>
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-btn ${isActive ? "nav-btn--active" : ""}`}
              >
                <span>Register</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Menú móvil */}
      {open && (
        <nav className="mobile-menu">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {!authed ? (
            <>
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
              >
                <span>Login</span>
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
              >
                <span>Register</span>
              </NavLink>
            </>
          ) : (
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
            >
              <span>Admin</span>
              <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
                {user?.first_name ?? ""}
              </span>
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
