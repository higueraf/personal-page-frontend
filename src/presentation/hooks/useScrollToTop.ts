import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Hook personalizado para hacer scroll al principio cuando cambia la ruta
 */
export function useScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);
}
