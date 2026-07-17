import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Video, LogOut, Terminal, Users, FolderGit2,
  UserCircle, BookMarked, MessageSquare, Globe, Cpu, Building2, GraduationCap,
  Menu, ChevronDown,
} from "lucide-react";
import { useAuth } from "../../shared/auth/useAuth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const MENU = [
  { to: "/admin",               label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/admin/tutorials",     label: "Tutoriales", icon: BookOpen },
  { to: "/admin/video-courses", label: "Cursos",     icon: Video },
  { to: "/admin/projects",      label: "Proyectos",  icon: FolderGit2 },
  { to: "/admin/playgrounds",   label: "Playgrounds", icon: Terminal },
  { to: "/admin/profile",       label: "Perfil / CV",icon: UserCircle },
  { to: "/admin/resources",     label: "Recursos",   icon: BookMarked },
  { to: "/admin/contact",       label: "Contacto",   icon: MessageSquare },
  { to: "/admin/assignments",   label: "Exámenes",    icon: Cpu },
  { to: "/admin/institutions",  label: "Instituciones", icon: Building2 },
  { to: "/admin/study-courses", label: "Cursos Est.",   icon: GraduationCap },
  { to: "/admin/users",         label: "Usuarios",   icon: Users },
];

function getInitials(name?: string | null) {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  const displayName = user?.full_name ?? user?.email ?? "Admin";

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Terminal size={18} />
        </div>
        <span className="font-display text-sm font-semibold text-white">Panel Admin</span>
      </div>

      <div className="px-3">
        <NavLink
          to="/"
          onClick={() => setMobileOpen(false)}
          className="mb-4 flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/5 px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-white/10"
        >
          <Globe size={16} className="text-sidebar-primary" />
          Ir al sitio
        </NavLink>
      </div>

      <div className="h-px bg-sidebar-border" />

      <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2.5 font-mono text-[0.7rem] uppercase tracking-wider text-sidebar-foreground/50">
          Menú del sistema
        </div>
        {MENU.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="admin-theme flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 hidden w-64 flex-col bg-sidebar lg:flex">
        {sidebarContent}
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0 [&>button]:text-white">
                <div className="flex h-full flex-col">{sidebarContent}</div>
              </SheetContent>
            </Sheet>
            <span className="font-display text-sm font-semibold text-foreground lg:hidden">
              Panel Admin
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground sm:inline">
                  {displayName}
                </span>
                <ChevronDown size={14} className="hidden text-muted-foreground sm:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut size={16} />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
