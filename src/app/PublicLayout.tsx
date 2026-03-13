import { Outlet } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import Footer from "../components/layout/Footer";

export default function PublicLayout() {
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
