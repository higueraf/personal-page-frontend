import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter, Youtube, Facebook } from "lucide-react";

const SITE_MARGIN = "mx-auto max-w-screen-xl px-6 sm:px-8 lg:px-12";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1A2A6C] text-white">

      {/* ── Columnas ──────────────────────────────────────────────── */}
      <div className={`${SITE_MARGIN} grid grid-cols-2 gap-10 py-16 md:grid-cols-3 lg:grid-cols-5`}>

        {/* Sobre mí */}
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <h3 className="footer-col-title">Sobre mí</h3>
          <ul className="footer-col-links">
            <li><Link to="/about">¿Quién soy?</Link></li>
            <li><Link to="/projects">Proyectos</Link></li>
          </ul>
        </div>

        {/* Explorar */}
        <div>
          <h3 className="footer-col-title">Explorar</h3>
          <ul className="footer-col-links">
            <li><Link to="/courses">Cursos</Link></li>
            <li><Link to="/tutorials">Tutoriales</Link></li>
            <li><Link to="/resources">Recursos</Link></li>
            <li><Link to="/playground">Playground</Link></li>
          </ul>
        </div>

        {/* Aprende */}
        <div>
          <h3 className="footer-col-title">Aprende</h3>
          <ul className="footer-col-links">
            <li><Link to="/courses">Full‑Stack</Link></li>
            <li><Link to="/tutorials">DevOps</Link></li>
            <li><Link to="/tutorials">Backend</Link></li>
            <li><Link to="/tutorials">Frontend</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="footer-col-title">Contacto</h3>
          <ul className="footer-col-links">
            <li><Link to="/contact">Ayuda</Link></li>
            <li><Link to="/contact">Enviar mensaje</Link></li>
          </ul>
        </div>

        {/* Sígueme */}
        <div>
          <h3 className="footer-col-title">Sígueme</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { href: "https://facebook.com",  icon: Facebook,  label: "Facebook"  },
              { href: "https://twitter.com",   icon: Twitter,   label: "Twitter"   },
              { href: "https://linkedin.com",  icon: Linkedin,  label: "LinkedIn"  },
              { href: "https://youtube.com",   icon: Youtube,   label: "YouTube"   },
              { href: "https://github.com",    icon: Github,    label: "GitHub"    },
            ].map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-all hover:border-[#FBBF24] hover:text-[#FBBF24] hover:-translate-y-0.5"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Copyright ─────────────────────────────────────────────── */}
      <div className="border-t border-white/10 bg-[#16236A]">
        <p className={`${SITE_MARGIN} py-4 text-center text-sm text-white/50`}>
          Copyright© {year}{" "}
          <Link to="/" className="text-[#FBBF24] transition-colors hover:text-[#F59E0B]">
            Francisco Higuera
          </Link>
          . Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
