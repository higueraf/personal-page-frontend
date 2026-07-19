import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, LayoutDashboard, Globe, ExternalLink, Users } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <LayoutDashboard size={20} />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bienvenido al panel de administración</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gestiona cursos, lecciones, páginas, bloques de contenido y todo lo relacionado con la plataforma.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-muted"
          >
            <Globe size={16} />
            Ver sitio
          </a>
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <BookOpen size={16} />
            Cursos
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Cursos activos", value: "24", icon: <BookOpen size={20} className="text-primary" />, accent: "bg-primary/10" },
          { label: "Usuarios", value: "1.2k", icon: <Users size={20} className="text-emerald-500" />, accent: "bg-emerald-500/10" },
          { label: "Ingresos últimos 30d", value: "$72.1k", icon: <ExternalLink size={20} className="text-violet-500" />, accent: "bg-violet-500/10" },
          { label: "Crecimiento", value: "+25.2%", icon: <ArrowRight size={20} className="text-amber-500" />, accent: "bg-amber-500/10" },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent}`}>
              {card.icon}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Student Analysis</p>
              <p className="mt-1 text-xs text-muted-foreground">Rendimiento de usuarios y actividad semanal</p>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">Últimos 7 días</div>
          </div>
          <div className="mt-6 h-56 rounded-3xl bg-gradient-to-r from-slate-100 via-white to-slate-100"></div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Geo Location</p>
              <p className="mt-1 text-xs text-muted-foreground">Ventas por región</p>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">Mensual</div>
          </div>
          <div className="mt-6 h-56 rounded-3xl bg-gradient-to-br from-slate-100 via-white to-slate-100"></div>
        </div>
      </div>
    </div>
  );
}
