import { Link } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { useAuth, avatarUrl } from "../../store/auth.store";
import ScrollNavLink from "./ScrollNavLink";
import { cn } from "@/presentation/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar";
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
import {
  Home, BookOpen, FileText, FolderGit2, User, Package, Phone,
  Menu, Terminal, Sun, Moon, LogOut, Settings, Shield,
  Github, Linkedin, Twitter, Facebook, Instagram, GraduationCap, Search, X
} from "lucide-react";

const SOCIAL_LINKS = [
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
  { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
];

const NAV_ITEMS = [
  { to: "/", label: "INICIO+", icon: Home, end: true },
  { to: "/courses", label: "CURSOS+", icon: BookOpen },
  { to: "/tutorials", label: "TUTORIALES+", icon: FileText },
  { to: "/projects", label: "PROYECTOS+", icon: FolderGit2 },
  { to: "/playground", label: "PLAYGROUND+", icon: Terminal },
  { to: "/about", label: "SOBRE MÍ+", icon: User },
  { to: "/resources", label: "RECURSOS+", icon: Package },
];

export default function TopNav() {
  const { theme, toggle } = useTheme();
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const authed = status === "authenticated";

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

  const handleLogout = async () => { await logout(); };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-1 px-3 py-4 text-xs font-bold tracking-wider text-white transition-colors hover:text-[#00C288]",
      isActive && "text-[#00C288]"
    );

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent",
      isActive && "bg-[#1A3FA8]/10 text-[#1A3FA8]"
    );

  return (
    <header className="site-header sticky top-0 z-40 w-full shadow-lg">

      {/* ── LÍNEA 1: Top Bar (Fondo azul oscuro con selectores y redes sociales) ── */}
      <div className="bg-[#1A3FA8] text-white/90 border-b border-white/10 hidden md:block">
        <div className="mx-auto max-w-screen-xl px-6 sm:px-8 lg:px-12 flex h-10 items-center justify-between">

          {/* Lado Izquierdo: Selectores tipo tabs */}
          <div className="flex h-full items-center text-xs font-medium">
            <span className="px-4 py-2 text-white/70 hover:text-white transition-colors cursor-pointer">
              Software Developer · Educator
            </span>
            <span className="bg-white text-[#1A3FA8] px-4 py-2.5 font-semibold rounded-t-sm h-full flex items-center shadow-inner cursor-pointer">
              Francisco Javier Higuera González
            </span>
          </div>

          {/* Lado Derecho: Redes + Divider + Auth + Theme */}
          <div className="flex items-center gap-4 text-xs">
            {/* Redes sociales */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Icon size={14} className="stroke-[1.5]" />
                </a>
              ))}
            </div>

            {/* Divisor vertical */}
            <span className="text-white/20">|</span>

            {/* Auth Link (Login / Register) */}
            <div className="flex items-center gap-1.5">
              {authed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-white/90 hover:text-white transition-colors focus:outline-none" aria-label="User menu">
                      <Avatar className="h-5 w-5">
                        {avatarUrl(user?.avatar) && !avatarError ? (
                          <AvatarImage
                            src={avatarUrl(user?.avatar)}
                            alt={`${user?.first_name} ${user?.last_name}`}
                            onError={() => setAvatarError(true)}
                          />
                        ) : null}
                        <AvatarFallback className="bg-white text-[#1A3FA8] text-[9px] font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{user?.first_name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin"><Shield size={14} className="mr-2" />Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/profile"><User size={14} className="mr-2" />Mi Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings"><Settings size={14} className="mr-2" />Configuración</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                      <LogOut size={14} className="mr-2" />Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="flex items-center gap-1.5 font-semibold hover:text-white transition-colors">
                  <User size={13} className="stroke-[2]" />
                  <span>Login / Register</span>
                </Link>
              )}
            </div>

            {/* Divisor vertical */}
            <span className="text-white/20">|</span>

            {/* Botón de cambio de tema */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="text-white/80 hover:text-white transition-colors"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── LÍNEA 2: Main Nav Bar (Fondo azul principal, logo ACADEMY, opciones, botón verde) ── */}
      <div className="bg-[#122258] text-white">
        <div className="mx-auto max-w-screen-xl px-6 sm:px-8 lg:px-12 flex h-16 items-center justify-between">

          {/* Logo: ACADEMY (Con gorro de graduado verde) */}
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
            <GraduationCap size={28} className="text-[#00C288] transition-transform group-hover:scale-105" />
            <span className="font-display text-xl font-extrabold tracking-wider">
              <span className="text-[#00C288]">JT</span>ACADEMY
            </span>
          </Link>

          {/* Opciones del menú (Solo en desktop) */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <ScrollNavLink
                key={to}
                to={to}
                end={end}
                className={navLinkClass}
              >
                <span>{label}</span>
              </ScrollNavLink>
            ))}
          </nav>

          {/* Lado derecho: Botón verde CTA (Contacto) + Botón móvil */}
          <div className="flex items-center gap-4">

            {/* CTA Button en desktop */}
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center gap-2 bg-[#00C288] hover:bg-[#00a875] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all shadow-md"
            >
              <span>TALK WITH ME</span>
              <ArrowRightWrapper />
            </Link>

            {/* Botón de menú móvil */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 text-white hover:bg-white/10" aria-label="Toggle menu">
                  <Menu size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 bg-background text-foreground">
                <div className="flex flex-col gap-1 p-4">
                  {/* Selector en móvil */}
                  <div className="flex bg-muted rounded-md p-1 mb-4">
                    <button className="flex-1 text-center py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-foreground">
                      Individuals
                    </button>
                    <button className="flex-1 text-center py-1.5 text-xs text-muted-foreground">
                      Organization
                    </button>
                  </div>

                  {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                    <ScrollNavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={mobileNavLinkClass}>
                      <Icon size={18} />
                      <span>{label.replace("+", "")}</span>
                    </ScrollNavLink>
                  ))}

                  <div className="my-2 h-px bg-border" />

                  {/* Redes en móvil */}
                  <div className="flex gap-3 px-3 py-2 justify-center">
                    {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#1A3FA8] hover:text-[#1A3FA8]"
                      >
                        <Icon size={16} />
                      </a>
                    ))}
                  </div>

                  {!authed ? (
                    <>
                      <ScrollNavLink to="/login" onClick={() => setOpen(false)} className={mobileNavLinkClass}>
                        <span>Iniciar sesión</span>
                      </ScrollNavLink>
                      <ScrollNavLink to="/register" onClick={() => setOpen(false)} className={mobileNavLinkClass}>
                        <span>Registrarse</span>
                      </ScrollNavLink>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <ScrollNavLink to="/admin" onClick={() => setOpen(false)} className={mobileNavLinkClass}>
                          <Shield size={18} /><span>Panel de Admin</span>
                        </ScrollNavLink>
                      )}
                      <ScrollNavLink to="/profile" onClick={() => setOpen(false)} className={mobileNavLinkClass}>
                        <User size={18} /><span>Mi Perfil</span>
                      </ScrollNavLink>
                      <button
                        onClick={() => { setOpen(false); handleLogout(); }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 w-full"
                      >
                        <LogOut size={18} /><span>Cerrar Sesión</span>
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}

// Wrapper simple para la flecha derecha
function ArrowRightWrapper() {
  return (
    <svg
      className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
