import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Code2, Server, Rocket,
  FolderGit2, GraduationCap, Layers, CheckCircle2
} from "lucide-react";
import { projectUseCases } from "../../../infrastructure/factories/project-module.factory";
import { Project } from "../../../domain/entities/project.entity";
import HeroCarousel from "../../components/patterns/HeroCarousel";
import HighlightPanels from "@/presentation/components/patterns/HighlightPanels";
import AboutBand from "@/presentation/components/patterns/AboutBand";
import SectionHeader from "@/presentation/components/patterns/SectionHeader";
import CourseCard from "@/presentation/components/patterns/CourseCard";
import { Button } from "@/presentation/components/ui/button";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar";

const PROJECT_ACCENTS = ["blue", "green", "purple"] as const;

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
  {
    icon: Code2,
    title: "Frontend moderno",
    description: "React, TypeScript y Tailwind para interfaces rápidas y mantenibles.",
    image: "/images/cards/web-code.jpg",
    to: "/projects",
    ctaLabel: "Ver proyectos",
  },
  {
    icon: Server,
    title: "Backend robusto",
    description: "Django y APIs REST con permisos, workflows y multi-tenant real.",
    image: "/images/cards/database-schema.jpg",
    to: "/courses",
    ctaLabel: "Ver cursos",
  },
  {
    icon: Rocket,
    title: "DevOps & entrega",
    description: "Docker, Git y CI/CD para llevar el código de local a producción.",
    image: "/images/cards/devops-cloud.jpg",
    to: "/tutorials",
    ctaLabel: "Ver tutoriales",
  },
];

const FALLBACK_PROJECTS: Project[] = [
  { id: "1", title: "Plataforma de Cursos",    slug: "#", description: "LMS con cursos paginados, bloques de contenido enriquecido y panel admin.",   tech_stack: ["Django", "React", "TypeScript"], order: 0, status: "PUBLISHED" },
  { id: "2", title: "API REST Multi-empresa",  slug: "#", description: "Backend con permisos por creator, workflow de status y soporte multi-tenant.", tech_stack: ["Django REST", "PostgreSQL", "JWT"], order: 1, status: "PUBLISHED" },
  { id: "3", title: "Dashboard Analytics",     slug: "#", description: "Panel de métricas en tiempo real con gráficas interactivas y exportación.",    tech_stack: ["React", "Recharts", "TanStack Query"], order: 2, status: "PUBLISHED" },
];

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-projects"],
    queryFn: () => projectUseCases.listFeatured(),
  });

  const projects = (data && data.length > 0) ? data : FALLBACK_PROJECTS;

  return (
    <div className="page-home">

      {/* ── BLUE HERO (Diseñado al estilo de la foto de Academy con tus imágenes asociadas) ── */}
      <section className="text-white py-20 lg:py-40 relative overflow-hidden" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1540]/95 via-[#1a2f5f]/90 to-[#0d1f3f]/95" />
        
        {/* Círculos decorativos de fondo detrás de los personajes */}
        <div className="absolute left-[5%] top-[15%] w-72 h-72 rounded-full bg-blue-600/30 blur-3xl pointer-events-none" />
        <div className="absolute right-[5%] top-[15%] w-72 h-72 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
        <div className="absolute left-[50%] bottom-[-10%] w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-screen-xl px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center relative z-10">
          
          {/* Columna Izquierda: Desarrolladora 3D con tecnologías flotantes */}
          <div className="hidden lg:flex justify-center items-center relative">
            <div className="absolute w-60 h-60 rounded-full bg-[#00C288]/10 -z-10 animate-pulse" />
            <img 
              src="/images/developer_girl_3d.png" 
              alt="Programadora 3D" 
              className="w-full max-w-[270px] object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Columna Central: Título, badges, botones y testimonial (ocupa 2 columnas en lg) */}
          <div className="lg:col-span-2 flex flex-col items-center text-center lg:items-start lg:text-left gap-6 px-4">
            
            {/* Badge de Disponibilidad */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-semibold text-[#00C288]">
              <span className="flex items-center gap-1.5 bg-[#00C288]/10 px-3 py-1 rounded-full border border-[#00C288]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C288] animate-ping" />
                Disponible para proyectos
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Construyo software <br/>
              <span className="text-[#00C288]">y enseño cómo hacerlo.</span>
            </h1>

            {/* Características con checkmark */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-white/80 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#00C288] shrink-0" />
                Desarrollo Full-Stack
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#00C288] shrink-0" />
                Cursos con Código Real
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#00C288] shrink-0" />
                Tutoriales Paso a Paso
              </span>
            </div>

            {/* Botones de acción principales */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-2">
              <Link
                to="/courses"
                className="bg-[#00C288] hover:bg-[#00a875] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm transition-all shadow-lg"
              >
                VER CURSOS →
              </Link>
              <Link
                to="/about"
                className="border border-white/30 hover:border-white hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-sm transition-all"
              >
                SOBRE MÍ →
              </Link>
            </div>

            {/* Testimonial de Francisco Higuera al estilo de la foto */}
            <div className="bg-[#0f1d4a] border border-white/5 rounded-xl p-4 flex gap-4 items-center max-w-md mt-6 shadow-2xl text-left">
              <Avatar className="h-12 w-12 border-2 border-[#00C288] shrink-0">
                <AvatarImage src="/images/francisco-higuera-photo.jpg" alt="Francisco Javier Higuera González" />
                <AvatarFallback className="bg-primary text-white font-bold">FH</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-white/80 leading-relaxed italic">
                  "Comparto código real y proyectos que construyo día a día para que logres dominar el stack moderno."
                </p>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#00C288]">
                  — Francisco Higuera · Educator & Developer
                </div>
              </div>
            </div>

            {/* Estadísticas/Métricas del contenido */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-8 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00C288]">{STACK.length}+</div>
                <div className="text-xs text-white/70 mt-1">Tecnologías</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00C288]">{projects.length}+</div>
                <div className="text-xs text-white/70 mt-1">Proyectos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#00C288]">100%</div>
                <div className="text-xs text-white/70 mt-1">Real & Propio</div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Desarrollador 3D sentado en el teclado */}
          <div className="flex justify-center items-center relative">
            <div className="absolute w-60 h-60 rounded-full bg-blue-600/10 -z-10 animate-pulse" />
            <img 
              src="/images/developer_boy_3d.png" 
              alt="Programador 3D con laptop" 
              className="w-full max-w-[280px] object-contain drop-shadow-[0_25px_25px_rgba(0,0,0,0.4)]"
            />
          </div>

        </div>
      </section>

      {/* ── CAROUSEL: ancho completo del navegador o con el margen del sitio ── */}
      <section className="hero-carousel-full py-6 sm:py-8 border-b border-white/5">
        <HeroCarousel fullWidth />
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="Especialidades"
            title="Full-stack de verdad"
            className="mb-10"
          />
          <HighlightPanels items={HIGHLIGHTS} />
        </div>
      </section>

      {/* ── SOBRE MÍ ── */}
      <section className="bg-muted/40 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-6">
          <AboutBand
            eyebrow="Sobre mí"
            title="Aprendiendo y construyendo en público"
            description="Cada curso y tutorial que publico nace de proyectos reales que construyo. Prefiero mostrar código que funciona antes que teoría suelta."
            images={["/images/carousel/workspace-coding.jpg", "/images/carousel/laptop-coding.jpg"]}
            badges={[
              { icon: Layers, label: "Stack moderno" },
              { icon: GraduationCap, label: "Contenido educativo" },
            ]}
            stats={[
              { value: `${STACK.length}+`, label: "Tecnologías" },
              { value: `${projects.length}+`, label: "Proyectos destacados" },
              { value: "100%", label: "Código propio" },
            ]}
            actions={
              <>
                <Button asChild>
                  <Link to="/about">Sobre mí <ArrowRight size={15} /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contacto</Link>
                </Button>
              </>
            }
          />
        </div>
      </section>

      {/* ── PROYECTOS RECIENTES ── */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="Proyectos recientes"
            title="Lo que estoy construyendo"
            className="mb-10"
          />

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map(({ id, title, description, tech_stack, slug, thumbnail }, idx) => (
                <CourseCard
                  key={id}
                  to={slug === "#" ? "/projects" : `/projects/${slug}`}
                  title={title}
                  description={description ?? undefined}
                  icon={FolderGit2}
                  image={thumbnail}
                  accent={PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length]}
                  badge={tech_stack?.[0]}
                  meta={
                    (tech_stack && tech_stack.length > 1) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tech_stack.slice(1, 4).map((t) => (
                          <span key={t} className="rounded bg-muted px-2 py-0.5 text-xs">{t}</span>
                        ))}
                      </div>
                    ) : null
                  }
                />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Button variant="outline" asChild>
              <Link to="/projects">
                Ver todos los proyectos <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA CURSOS ── */}
      <section className="bg-muted/40 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12">
            <img
              src="/images/cards/whiteboard-planning.jpg"
              alt=""
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-80 object-cover opacity-20 mix-blend-luminosity md:block"
            />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">¿Quieres aprender este stack?</h2>
                <p className="mt-2 max-w-lg text-primary-foreground/80">
                  Cursos paginados, sin scroll eterno, con código copiable y ejercicios reales.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Button asChild size="lg" className="bg-brand-accent text-[#1E1300] hover:bg-brand-accentHover">
                  <Link to="/courses">
                    Explorar cursos <ArrowRight size={15} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Link to="/tutorials">Ver tutoriales</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
