import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter, Terminal } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="brand-icon brand-icon--sm">
            <Terminal size={16} />
          </div>
          <span className="footer-name">Francisco Higuera</span>
        </div>

        <nav className="footer-links">
          <Link to="/courses">Cursos</Link>
          <Link to="/tutorials">Tutoriales</Link>
          <Link to="/projects">Proyectos</Link>
          <Link to="/about">Sobre mí</Link>
          <Link to="/contact">Contacto</Link>
        </nav>

        <div className="footer-social">
          <a href="#" aria-label="GitHub"><Github size={18} /></a>
          <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
          <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
        </div>

        <p className="footer-copy">
          © {year} Francisco Javier Higuera González · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
