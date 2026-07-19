import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface ScrollNavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string | (({ isActive }: { isActive: boolean }) => string);
  end?: boolean;
  onClick?: () => void;
}

export default function ScrollNavLink({ 
  to, 
  children, 
  className, 
  end, 
  onClick 
}: ScrollNavLinkProps) {
  const location = useLocation();

  useEffect(() => {
    // Scroll al principio cuando cambia la ruta
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <NavLink
      to={to}
      end={end}
      className={className}
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
}
