import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Code2, Database, Globe, Layers,
  BookOpen, FolderGit2, Cpu, Server, Smartphone, RefreshCw,
} from "lucide-react";
import http from "../../shared/api/http";
import ProfilePhoto from "../../components/ProfilePhoto";

interface Project {
  id: string; title: string; slug: string;
  description?: string; tech_stack?: string[];
}

const STACK = [
  { name: "React",      color: "#61DAFB" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Python",     color: "#F7CA3E" },
  { name: "Django",     color: "#0C4B33" },
  { name: "Node.js",    color: "#83CD29" },
  { name: "PostgreSQL", color: "#336791" },
  { name: "MongoDB",    color: "#47A248" },
  { name: "MSSQL",      color: "#CC2927" },
  { name: "C#",         color: "#239120" },
  { name: ".NET",       color: "#512BD4" },
  { name: "Java",       color: "#007396" },
  { name: "Docker",     color: "#2496ED" },
  { name: "Git",        color: "#F05032" },
];

const HIGHLIGHTS = [
  { icon: Code2,       label: "Frontend",  desc: "React · TypeScript · Tailwind" },
  { icon: Server,      label: "Backend",   desc: "Django · Node · REST APIs" },
  { icon: Database,    label: "Datos",     desc: "PostgreSQL · Redis · ORM" },
  { icon: Smartphone,  label: "Mobile",    desc: "React Native · Expo" },
  { icon: Globe,       label: "DevOps",    desc: "Docker · Git · CI/CD" },
  { icon: Cpu,         label: "IA & Tools",desc: "Python · Jupyter · Anthropic API" },
];

const ACCENT_COLORS = ["#FBBF24", "#60A5FA", "#34D399", "#A78BFA", "#F87171", "#34D399"];

const FALLBACK_PROJECTS: Project[] = [
  { id: "1", title: "Plataforma de Cursos",    slug: "#", description: "LMS con cursos paginados, bloques de contenido enriquecido y panel admin.",   tech_stack: ["Django", "React", "TypeScript"] },
  { id: "2", title: "API REST Multi-empresa",  slug: "#", description: "Backend con permisos por creator, workflow de status y soporte multi-tenant.", tech_stack: ["Django REST", "PostgreSQL", "JWT"] },
  { id: "3", title: "Dashboard Analytics",     slug: "#", description: "Panel de métricas en tiempo real con gráficas interactivas y exportación.",    tech_stack: ["React", "Recharts", "TanStack Query"] },
];

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-projects"],
    queryFn: () => http.get("/public/projects/featured").then(r => r.data.data as Project[]),
  });

  const projects = (data && data.length > 0) ? data : FALLBACK_PROJECTS;

  return (
    <div className="page-home">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-profile-header">
            <ProfilePhoto size="lg" />
            
            <div className="hero-badge mt-4">
              <span className="hero-badge-dot" />
              Disponible para proyectos
            </div>
          </div>
          
          <h1 className="hero-title">
            Construyo software<br />
            <span className="hero-title-accent">y enseño cómo hacerlo.</span>
          </h1>
          
          <p className="hero-sub">
            Desarrollador full-stack especializado en Django + React. Creo cursos, tutoriales
            y herramientas para que otros también dominen el stack moderno.
          </p>

          <div className="hero-actions">
            <Link to="/courses" className="btn btn--primary">Ver cursos <ArrowRight size={16} /></Link>
            <Link to="/projects" className="btn btn--outline">Proyectos</Link>
          </div>
        </div>

        <div className="hero-stack-panel">
          <div className="stack-label">Stack tecnológico</div>
          <div className="stack-grid">
            {STACK.map((s) => (
              <div key={s.name} className="stack-chip" style={{ "--chip-color": s.color } as React.CSSProperties}>
                <span className="stack-chip-dot" /> {s.name}
              </div>
            ))}
          </div>
          
          <div className="stack-terminal">
            <div className="terminal-bar">
              <span /><span /><span />
              <span className="terminal-title">~/projects</span>
            </div>
            <div className="terminal-body" style={{ minHeight: "300px" }}>
              <div><span className="t-prompt">$</span> git status</div>
              <div className="t-ok">✔ working tree clean</div>
              <div><span className="t-prompt">$</span> npm run dev</div>
              <div className="t-dim">▶ Server running on :5173</div>
              <div><span className="t-prompt">$</span> python manage.py runserver</div>
              <div className="t-dim">▶ Django on :8000</div>
              <div><span className="t-prompt">$</span> dotnet watch</div>
              <div className="t-dim">▶ .NET app running...</div>
              <div><span className="t-prompt">$</span> java -jar app.jar</div>
              <div className="t-dim">▶ Spring Boot app started</div>
              <div className="t-cursor">_</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="section section--muted">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">Especialidades</span>
            <h2 className="section-title">Full-stack de verdad</h2>
          </div>
          <div className="highlights-grid">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="highlight-card">
                <div className="highlight-icon"><Icon size={22} /></div>
                <div className="highlight-label">{label}</div>
                <div className="highlight-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROYECTOS RECIENTES ── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">Proyectos recientes</span>
            <h2 className="section-title">Lo que estoy construyendo</h2>
          </div>

          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: ".85rem", marginBottom: 16 }}>
              <RefreshCw size={14}/> Cargando proyectos…
            </div>
          )}

          <div className="projects-grid">
            {projects.map(({ id, title, description, tech_stack, slug }, idx) => (
              <Link key={id} to={slug === "#" ? "/projects" : `/projects/${slug}`} className="project-card">
                <div className="project-card-icon" style={{ "--accent": ACCENT_COLORS[idx % ACCENT_COLORS.length] } as React.CSSProperties}>
                  <FolderGit2 size={24} />
                </div>
                <div className="project-card-body">
                  <h3 className="project-card-title">{title}</h3>
                  <p className="project-card-desc">{description}</p>
                  {(tech_stack && tech_stack.length > 0) && (
                    <div className="project-stack">
                      {tech_stack.slice(0, 3).map((t) => (
                        <span key={t} className="project-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowRight size={16} className="project-arrow" />
              </Link>
            ))}
          </div>

          <div className="section-cta">
            <Link to="/projects" className="btn btn--outline">
              Ver todos los proyectos <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA CURSOS ── */}
      <section className="cta-band">
        <div className="cta-band-inner">
          <div className="cta-band-text">
            <h2>¿Quieres aprender este stack?</h2>
            <p>Cursos paginados, sin scroll eterno, con código copiable y ejercicios reales.</p>
          </div>
          <div className="cta-band-actions">
            <Link to="/courses" className="btn btn--primary">Explorar cursos <ArrowRight size={15} /></Link>
            <Link to="/tutorials" className="btn btn--ghost">Ver tutoriales</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
