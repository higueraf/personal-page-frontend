import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Video, LogOut, Terminal, Users, FolderGit2, UserCircle, BookMarked, MessageSquare, Globe, Cpu } from "lucide-react";
import { useAuth } from "../../shared/auth/useAuth";

const MENU = [
  { to: "/admin",               label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/admin/tutorials",     label: "Tutoriales", icon: BookOpen },
  { to: "/admin/video-courses", label: "Cursos",     icon: Video },
  { to: "/admin/projects",      label: "Proyectos",  icon: FolderGit2 },
  { to: "/admin/profile",       label: "Perfil / CV",icon: UserCircle },
  { to: "/admin/resources",     label: "Recursos",   icon: BookMarked },
  { to: "/admin/contact",       label: "Contacto",   icon: MessageSquare },
  { to: "/admin/assignments", label: "Exámenes",    icon: Cpu },
  { to: "/admin/users",         label: "Usuarios",   icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="brand-icon" style={{ width: 32, height: 32 }}>
            <Terminal size={16} />
          </div>
          <span className="admin-header-title">Panel Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: ".82rem", color: "rgba(255,255,255,.65)" }}>
            {user?.full_name ?? user?.email ?? "Admin"}
          </span>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", borderRadius: "var(--radius-md)", padding: "6px 12px", fontSize: ".82rem", fontWeight: 500, cursor: "pointer" }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <NavLink to="/" className="admin-sidebar-item" style={{ marginBottom: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)" }}>
            <Globe size={16} style={{ color: "var(--color-accent)" }} /> 
            <span style={{ fontWeight: 600 }}>Ir al sitio</span>
          </NavLink>
          
          <div className="admin-sidebar-header-line" style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "0 0 16px 0" }}></div>

          <div className="admin-sidebar-label">Menú del Sistema</div>
          {MENU.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `admin-sidebar-item ${isActive ? "admin-sidebar-item--active" : ""}`}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </aside>
        <div className="admin-main"><Outlet /></div>
      </div>
    </div>
  );
}
