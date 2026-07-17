import { useQuery } from "@tanstack/react-query";
import { Briefcase, GraduationCap, Award, Globe, Star, RefreshCw, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import http from "../../shared/api/http";
import ProfilePhoto from "../../components/ProfilePhoto";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ItemType = "EXPERIENCE" | "EDUCATION" | "CERTIFICATION" | "SKILL" | "LANGUAGE" | "AWARD" | "PUBLICATION" | "VOLUNTEER";

interface ProfileItem {
  id: string; type: ItemType; title: string; subtitle?: string;
  location?: string; start_date?: string; end_date?: string;
  description?: string; tags?: string[]; url?: string; logo?: string;
}

const TYPE_META: Record<ItemType, { label: string; icon: React.ReactNode; color: string }> = {
  EXPERIENCE: { label: "Experiencia", icon: <Briefcase size={18} />, color: "#3b6ef0" },
  EDUCATION: { label: "Educación", icon: <GraduationCap size={18} />, color: "#8b5cf6" },
  CERTIFICATION: { label: "Certificaciones", icon: <Award size={18} />, color: "#f59e0b" },
  SKILL: { label: "Habilidades", icon: <Star size={18} />, color: "#22c55e" },
  LANGUAGE: { label: "Idiomas", icon: <Globe size={18} />, color: "#06b6d4" },
  AWARD: { label: "Reconocimientos", icon: <Award size={18} />, color: "#ef4444" },
  PUBLICATION: { label: "Publicaciones", icon: <ExternalLink size={18} />, color: "#f97316" },
  VOLUNTEER: { label: "Voluntariado", icon: <Briefcase size={18} />, color: "#10b981" },
};

const SECTIONS: ItemType[] = ["EXPERIENCE", "EDUCATION", "CERTIFICATION", "SKILL", "LANGUAGE", "AWARD", "PUBLICATION", "VOLUNTEER"];

function dateRange(start?: string, end?: string) {
  if (!start) return null;
  return `${start} — ${end ?? "Actualidad"}`;
}

function ProfileCard({ item }: { item: ProfileItem }) {
  const meta = TYPE_META[item.type];
  return (
    <Card className="relative overflow-hidden">
      {/* Efecto decorativo de fondo */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-50"
        style={{ background: `linear-gradient(135deg, ${meta.color}15 0%, transparent 70%)` }}
      />

      <CardContent className="flex gap-5 p-6">
        {item.logo ? (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-border bg-background p-2 shadow-md">
            <img src={item.logo} alt={item.subtitle || ""} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl shadow-md"
            style={{ background: meta.color + "20", border: `2px solid ${meta.color}40`, color: meta.color }}
          >
            {meta.icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold leading-snug text-foreground">
                {item.title}
              </h3>
              {item.subtitle && (
                <div className="mt-1 text-sm font-semibold" style={{ color: meta.color }}>
                  {item.subtitle}
                </div>
              )}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-px"
                style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}10` }}
              >
                <ExternalLink size={12} /> Ver
              </a>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {dateRange(item.start_date, item.end_date) && (
              <span className="flex items-center gap-1.5 rounded bg-muted px-2 py-1">
                <CalendarDays size={12} /> {dateRange(item.start_date, item.end_date)}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1.5 rounded bg-muted px-2 py-1">
                <MapPin size={12} /> {item.location}
              </span>
            )}
          </div>

          {item.description && (
            <p className="mt-3 text-justify text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map(t => (
                <Badge
                  key={t}
                  variant="outline"
                  className="font-medium"
                  style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}15` }}
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function About() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-profile"],
    queryFn: () => http.get("/public/profile").then(r => r.data.data as ProfileItem[]),
  });

  const items = data ?? [];

  const grouped = SECTIONS.reduce<Record<ItemType, ProfileItem[]>>((acc, t) => {
    acc[t] = items.filter(i => i.type === t);
    return acc;
  }, {} as any);

  const visibleSections = SECTIONS.filter(t => grouped[t].length > 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-12 flex flex-wrap items-start gap-10">
        <div className="flex-none text-center">
          <ProfilePhoto size="xl" className="mb-6" />
          <h1 className="mb-3 font-display text-4xl font-extrabold text-foreground">
            Francisco Higuera
          </h1>
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <span className="text-sm font-semibold text-primary">Software Developer</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm font-semibold text-primary">Educator</span>
          </div>
          <p className="mx-auto max-w-[400px] text-sm leading-relaxed text-muted-foreground">
            Desarrollador full-stack con pasión por la educación técnica. Me especializo en crear
            software de producción y herramientas que faciliten el aprendizaje de las tecnologías modernas.
          </p>
        </div>

        <div className="min-w-[300px] flex-1">
          <Card className="bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-muted-foreground">
                <span className="h-3 w-3 rounded-full bg-primary" />
                Resumen Rápido
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">📍 Ubicación</div>
                  <div className="text-base font-semibold text-foreground">Quito-Ecuador</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">💼 Experiencia</div>
                  <div className="text-base font-semibold text-foreground">20+ años</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">🎓 Educación</div>
                  <div className="text-base font-semibold text-foreground">Ingeniería en Sistemas</div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">🚀 Especialidad</div>
                  <div className="text-base font-semibold text-foreground">Full-Stack</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw size={14} /> Cargando…
        </div>
      )}

      {!isLoading && visibleSections.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Contenido en construcción.
        </div>
      )}

      <div className="flex flex-col gap-10">
        {visibleSections.map(type => {
          const meta = TYPE_META[type];
          return (
            <section key={type}>
              <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {meta.label}
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {grouped[type].map(item => (
                  <ProfileCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
