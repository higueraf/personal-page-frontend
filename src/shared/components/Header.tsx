import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Avatar from './Avatar';
import { 
  Menu, X, LogOut, User, Settings, BookOpen, 
  Video, FolderGit2, Home 
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        
        {/* Logo/Brand */}
        <Link 
          to="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'var(--color-text)',
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
          }}>
            FH
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '18px',
          }}>
            Francisco Higuera
          </span>
        </Link>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '30px',
        }}>
          <Link 
            to="/" 
            style={{ 
              color: 'var(--color-text)', 
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Home size={18} />
            Inicio
          </Link>
          
          <Link 
            to="/projects" 
            style={{ 
              color: 'var(--color-text)', 
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FolderGit2 size={18} />
            Proyectos
          </Link>
          
          <Link 
            to="/tutorials" 
            style={{ 
              color: 'var(--color-text)', 
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={18} />
            Tutoriales
          </Link>
          
          <Link 
            to="/courses" 
            style={{ 
              color: 'var(--color-text)', 
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Video size={18} />
            Cursos
          </Link>
        </nav>

        {/* User Profile Section */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Avatar
              src="/path/to/tu/foto-profesional.jpg" // Reemplaza con tu foto
              size="sm"
              alt={user?.email || 'User avatar'}
              fallback={getUserInitials()}
              className="nav-avatar"
            />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '8px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '200px',
              zIndex: 1000,
            }}>
              <div style={{
                padding: '12px',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <Avatar
                    src="/path/to/tu/foto-profesional.jpg" // Reemplaza con tu foto
                    size="sm"
                    fallback={getUserInitials()}
                  />
                  <div>
                    <div style={{
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      fontSize: '14px',
                    }}>
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                    }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '4px',
              }}>
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <User size={16} />
                  Mi Perfil
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Settings size={16} />
                  Configuración
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    color: 'var(--color-error)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.2s',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '64px',
          left: '0',
          right: '0',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '20px',
          display: 'none',
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}>
            <Link to="/" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
              Inicio
            </Link>
            <Link to="/projects" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
              Proyectos
            </Link>
            <Link to="/tutorials" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
              Tutoriales
            </Link>
            <Link to="/courses" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
              Cursos
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
