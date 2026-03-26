import { Link } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../../shared/theme/ThemeProvider";
import { useAuth } from "../../shared/auth/useAuth";
import ScrollNavLink from "./ScrollNavLink";
import {
  Home, BookOpen, FileText, FolderGit2, User, Package, Phone,
  Menu, X, Terminal, Sun, Moon, ChevronDown, LogOut, Settings, Shield
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/courses", label: "Cursos", icon: BookOpen },
  { to: "/tutorials", label: "Tutoriales", icon: FileText },
  { to: "/projects", label: "Proyectos", icon: FolderGit2 },
  { to: "/playground", label: "Playground", icon: Terminal },
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

  // Verificar si el usuario es administrador
  const isAdmin = authed && (
    user?.role?.name === 'admin' || 
    user?.permissions?.includes('admin') ||
    user?.permissions?.includes('admin_access')
  );

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
              <div className="brand-name">Francisco Javier Higuera González</div>
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
            <ScrollNavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }: { isActive: boolean }) => `nav-btn ${isActive ? "nav-btn--active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </ScrollNavLink>
          ))}

          {/* Auth (usuario logueado) */}
          {authed ? (
            <div className="user-profile-section">
              {/* Botón de administración para admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="nav-btn nav-btn--admin"
                  title="Panel de Administración"
                >
                  <Shield size={16} />
                  <span>Admin</span>
                </Link>
              )}
              
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
              <ScrollNavLink
                to="/login"
                className={({ isActive }: { isActive: boolean }) => `nav-btn ${isActive ? "nav-btn--active" : ""}`}
              >
                <span>Login</span>
              </ScrollNavLink>
              <ScrollNavLink
                to="/register"
                className={({ isActive }: { isActive: boolean }) => `nav-btn ${isActive ? "nav-btn--active" : ""}`}
              >
                <span>Register</span>
              </ScrollNavLink>
            </>
          )}
        </div>
      </nav>

      {/* Menú móvil */}
      {open && (
        <nav className="mobile-menu">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <ScrollNavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </ScrollNavLink>
          ))}

          {!authed ? (
            <>
              <ScrollNavLink
                to="/login"
                onClick={() => setOpen(false)}
                className={({ isActive }: { isActive: boolean }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
              >
                <span>Login</span>
              </ScrollNavLink>
              <ScrollNavLink
                to="/register"
                onClick={() => setOpen(false)}
                className={({ isActive }: { isActive: boolean }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
              >
                <span>Register</span>
              </ScrollNavLink>
            </>
          ) : (
            <>
              {/* Botón de administración para admin en móvil */}
              {isAdmin && (
                <ScrollNavLink
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={({ isActive }: { isActive: boolean }) => `mobile-nav-btn mobile-nav-btn--admin ${isActive ? "mobile-nav-btn--active" : ""}`}
                >
                  <Shield size={18} />
                  <span>Panel de Admin</span>
                </ScrollNavLink>
              )}
              
              <ScrollNavLink
                to="/profile"
                onClick={() => setOpen(false)}
                className={({ isActive }: { isActive: boolean }) => `mobile-nav-btn ${isActive ? "mobile-nav-btn--active" : ""}`}
              >
                <User size={18} />
                <span>Mi Perfil</span>
              </ScrollNavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
