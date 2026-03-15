import { Outlet } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import Footer from "../components/layout/Footer";
import { useScrollToTop } from "../hooks/useScrollToTop";

export default function PublicLayout() {
  // Hook para hacer scroll al principio cuando cambia la ruta
  useScrollToTop();

  return (
    <div className="app-root">
      <TopNav />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
