import { useQuery } from "@tanstack/react-query";
import { Briefcase, GraduationCap, Award, Globe, Star, RefreshCw, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import http from "../../shared/api/http";
import ProfilePhoto from "../../components/ProfilePhoto";

type ItemType = "EXPERIENCE" | "EDUCATION" | "CERTIFICATION" | "SKILL" | "LANGUAGE" | "AWARD" | "PUBLICATION" | "VOLUNTEER";

interface ProfileItem {
  id: string; type: ItemType; title: string; subtitle?: string;
  location?: string; start_date?: string; end_date?: string;
  description?: string; tags?: string[]; url?: string; logo?: string;
}

const TYPE_META: Record<ItemType, { label: string; icon: React.ReactNode; color: string }> = {
  EXPERIENCE:    { label: "Experiencia",       icon: <Briefcase size={18}/>,     color: "#3b6ef0" },
  EDUCATION:     { label: "Educación",          icon: <GraduationCap size={18}/>, color: "#8b5cf6" },
  CERTIFICATION: { label: "Certificaciones",    icon: <Award size={18}/>,         color: "#f59e0b" },
  SKILL:         { label: "Habilidades",        icon: <Star size={18}/>,          color: "#22c55e" },
  LANGUAGE:      { label: "Idiomas",            icon: <Globe size={18}/>,         color: "#06b6d4" },
  AWARD:         { label: "Reconocimientos",    icon: <Award size={18}/>,         color: "#ef4444" },
  PUBLICATION:   { label: "Publicaciones",      icon: <ExternalLink size={18}/>,  color: "#f97316" },
  VOLUNTEER:     { label: "Voluntariado",       icon: <Briefcase size={18}/>,     color: "#10b981" },
};

const SECTIONS: ItemType[] = ["EXPERIENCE", "EDUCATION", "CERTIFICATION", "SKILL", "LANGUAGE", "AWARD", "PUBLICATION", "VOLUNTEER"];

function dateRange(start?: string, end?: string) {
  if (!start) return null;
  return `${start} — ${end ?? "Actualidad"}`;
}

function ProfileCard({ item }: { item: ProfileItem }) {
  const meta = TYPE_META[item.type];
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", gap: 16 }}>
      {item.logo ? (
        <img src={item.logo} alt={item.subtitle || ""} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, border: "1px solid var(--color-border)", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: meta.color + "18", border: `1px solid ${meta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: meta.color }}>
          {meta.icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".97rem", color: "var(--color-text)", margin: "0 0 2px" }}>{item.title}</h3>
            {item.subtitle && <div style={{ fontSize: ".85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{item.subtitle}</div>}
          </div>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-primary)", fontSize: ".75rem", textDecoration: "none", flexShrink: 0 }}>
              <ExternalLink size={12}/> Ver
            </a>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6, fontSize: ".78rem", color: "var(--color-text-muted)" }}>
          {dateRange(item.start_date, item.end_date) && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CalendarDays size={12}/> {dateRange(item.start_date, item.end_date)}
            </span>
          )}
          {item.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={12}/> {item.location}
            </span>
          )}
        </div>

        {item.description && (
          <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)", fontSize: ".85rem", lineHeight: 1.65 }}>
            {item.description}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {item.tags.map(t => (
              <span key={t} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", padding: "2px 8px", borderRadius: 99, fontSize: ".72rem", color: "var(--color-text-muted)" }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
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
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 36, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <ProfilePhoto size="lg" className="flex-shrink-0" />
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.2rem", color: "var(--color-text)", marginBottom: 8 }}>
            Sobre mí
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: ".95rem", lineHeight: 1.6, maxWidth: 620 }}>
            Desarrollador full-stack con foco en educación técnica y software de producción. Aquí está mi trayectoria.
          </p>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
          <RefreshCw size={14}/> Cargando…
        </div>
      )}

      {!isLoading && visibleSections.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)", fontSize: ".9rem" }}>
          Contenido en construcción.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {visibleSections.map(type => {
          const meta = TYPE_META[type];
          return (
            <section key={type}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, paddingBottom: 10, borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", margin: 0 }}>
                  {meta.label}
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
