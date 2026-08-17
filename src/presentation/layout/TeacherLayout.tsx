import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GraduationCap, LogOut, Globe, Menu, ChevronDown, BookOpen } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { cn } from "@/presentation/lib/utils";
import { Avatar, AvatarFallback } from "@/presentation/components/ui/avatar";
import { Button } from "@/presentation/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/presentation/components/ui/sheet";

const MENU = [{ to: "/teacher/cursos", label: "Mis cursos", icon: BookOpen, end: false }];

function getInitials(name?: string | null) {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

/** Layout del panel de profesor (LMS académico). Reutiliza el shell visual del panel admin para mantener una sola identidad de "pantalla de gestión". */
export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  const displayName = user?.full_name ?? user?.email ?? "Profesor";

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap size={18} />
        </div>
        <span className="font-display text-sm font-semibold text-white">Panel de Profesor</span>
      </div>

      <div className="px-3">
        <NavLink
          to="/"
          onClick={() => setMobileOpen(false)}
          className="mb-4 flex items-center gap-2.5 rounded-2xl border border-sidebar-border bg-white/5 px-3 py-3 text-sm font-medium text-sidebar-foreground transition-all hover:bg-sidebar-hover hover:text-white"
        >
          <Globe size={16} className="text-sidebar-primary" />
          Ir al sitio
        </NavLink>
      </div>

      <div className="h-px bg-sidebar-border" />

      <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2.5 font-mono text-[0.7rem] uppercase tracking-wider text-sidebar-foreground/50">
          Gestión académica
        </div>
        {MENU.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-hover hover:text-white",
                "border-l-4 border-transparent",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-sidebar-primary shadow-[inset_4px_0_0_rgba(139,92,246,.65)]"
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
      <aside className="fixed inset-y-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex border-r border-sidebar-border">
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
            <span className="font-display text-sm font-semibold text-foreground lg:hidden">Panel de Profesor</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground sm:inline">{displayName}</span>
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
