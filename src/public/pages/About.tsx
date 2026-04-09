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
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      display: "flex",
      gap: 20,
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Efecto decorativo de fondo */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "80px",
        height: "80px",
        background: `linear-gradient(135deg, ${meta.color}15 0%, transparent 70%)`,
        borderRadius: "0 0 0 100%",
        opacity: 0.5,
        pointerEvents: "none"
      }} />

      {item.logo ? (
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          border: "2px solid var(--color-border)",
          padding: 8,
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <img src={item.logo} alt={item.subtitle || ""} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ) : (
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: meta.color + "20",
          border: `2px solid ${meta.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <div style={{ color: meta.color, fontSize: "1.2rem" }}>
            {meta.icon}
          </div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.15rem",
              color: "var(--color-text)",
              margin: "0 0 4px",
              lineHeight: 1.3
            }}>
              {item.title}
            </h3>
            {item.subtitle && (
              <div style={{
                fontSize: "0.95rem",
                color: meta.color,
                fontWeight: 600,
                marginTop: 4
              }}>
                {item.subtitle}
              </div>
            )}
          </div>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: meta.color,
                fontSize: "0.8rem",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${meta.color}30`,
                background: `${meta.color}10`,
                transition: "all 0.2s ease",
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${meta.color}20`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${meta.color}10`;
                e.currentTarget.style.transform = "translateY(0)";
              }}>
              <ExternalLink size={12} /> Ver
            </a>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {dateRange(item.start_date, item.end_date) && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--color-bg-muted)", borderRadius: "4px" }}>
              <CalendarDays size={12} /> {dateRange(item.start_date, item.end_date)}
            </span>
          )}
          {item.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--color-bg-muted)", borderRadius: "4px" }}>
              <MapPin size={12} /> {item.location}
            </span>
          )}
        </div>

        {item.description && (
          <p style={{
            margin: "12px 0 0",
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            textAlign: "justify"
          }}>
            {item.description}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {item.tags.map(t => (
              <span key={t} style={{
                background: `${meta.color}15`,
                border: `1px solid ${meta.color}30`,
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: meta.color,
                fontWeight: 500,
                transition: "all 0.2s ease"
              }}>
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 48, display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 auto", textAlign: "center" }}>
          <ProfilePhoto size="xl" className="mb-6" />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.4rem", color: "var(--color-text)", marginBottom: 12, textAlign: "center" }}>
            Francisco Higuera
          </h1>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "8px 16px", background: "var(--color-primary-soft)", borderRadius: "20px", border: "1px solid var(--color-primary)" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-primary)" }}>Software Developer</span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>·</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-primary)" }}>Educator</span>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
            Desarrollador full-stack con pasión por la educación técnica. Me especializo en crear
            software de producción y herramientas que faciliten el aprendizaje de las tecnologías modernas.
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ background: "linear-gradient(135deg, var(--color-surface) 0%, rgba(var(--color-primary-rgb), 0.05) 100%)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 32, marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, background: "var(--color-primary)", borderRadius: "50%" }} />
              Resumen Rápido
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 4 }}>📍 Ubicación</div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>Quito-Ecuador</div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 4 }}>💼 Experiencia</div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>20+ años</div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 4 }}>🎓 Educación</div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>Ingeniería en Sistemas</div>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 4 }}>🚀 Especialidad</div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>Full-Stack</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
          <RefreshCw size={14} /> Cargando…
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
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "#2563eb", margin: 0 }}>
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
