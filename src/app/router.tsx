import { createBrowserRouter } from "react-router-dom";
import { RequireAuth }   from "../shared/auth/RequireAuth";
import PublicLayout      from "./PublicLayout";

// ── Páginas públicas ──────────────────────────────────────────────────────────
import Home              from "../public/pages/Home";
import Login             from "../public/pages/Login";
import Register          from "../public/pages/Register";
import TutorialsList     from "../public/pages/TutorialsList";
import TutorialViewer    from "../public/pages/TutorialViewer";
import VideosCoursesList from "../public/pages/VideosCoursesList";
import CourseViewer      from "../public/pages/CourseViewer";
import ProjectsList      from "../public/pages/ProjectsList";
import ProjectDetail     from "../public/pages/ProjectDetail";
import About             from "../public/pages/About";
import Resources         from "../public/pages/Resources";
import Contact           from "../public/pages/Contact";
import UserProfile       from "../public/pages/UserProfile";
import UserSettings      from "../public/pages/UserSettings";

// ── Páginas admin ─────────────────────────────────────────────────────────────
import AdminLayout       from "../admin/layout/AdminLayout";
import AdminDashboard    from "../admin/pages/AdminDashboard";
import AdminTutorials    from "../admin/pages/AdminTutorials";
import TutorialEditor    from "../admin/pages/TutorialEditor";
import AdminVideoCourses from "../admin/pages/AdminVideoCourses";
import CourseEditor      from "../admin/pages/CourseEditor";
import AdminUsers        from "../admin/pages/AdminUsers";
import AdminProjects     from "../admin/pages/AdminProjects";
import AdminProfile      from "../admin/pages/AdminProfile";
import AdminResources    from "../admin/pages/AdminResources";
import AdminContact      from "../admin/pages/AdminContact";

export const router = createBrowserRouter([
  // ── Público ───────────────────────────────────────────────────────────────
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true,  element: <Home /> },
      { path: "login",    element: <Login /> },
      { path: "register", element: <Register /> },

      { path: "tutorials",             element: <TutorialsList /> },
      { path: "tutorials/:courseSlug", element: <TutorialViewer /> },

      { path: "courses",               element: <VideosCoursesList /> },
      { path: "courses/:courseSlug",   element: <CourseViewer /> },

      { path: "projects",              element: <ProjectsList /> },
      { path: "projects/:slug",        element: <ProjectDetail /> },

      { path: "resources", element: <Resources /> },
      { path: "about",     element: <About /> },
      { path: "contact",   element: <Contact /> },

      // Rutas protegidas de cuenta (dentro de PublicLayout)
      {
        element: <RequireAuth />,
        children: [
          { path: "profile",  element: <UserProfile /> },
          { path: "settings", element: <UserSettings /> },
        ]
      }
    ],
  },

  { path: "/admin/login", element: <Login /> },

  // ── Admin protegido ───────────────────────────────────────────────────────
  {
    path: "/admin",
    element: <RequireAuth />,
    children: [
      {
        path: "",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },

          { path: "tutorials",                    element: <AdminTutorials /> },
          { path: "tutorials/:courseId/edit",     element: <TutorialEditor /> },

          { path: "video-courses",                element: <AdminVideoCourses /> },
          { path: "video-courses/:courseId/edit", element: <CourseEditor /> },

          { path: "projects",  element: <AdminProjects /> },
          { path: "profile",   element: <AdminProfile /> },
          { path: "resources", element: <AdminResources /> },
          { path: "contact",   element: <AdminContact /> },
          { path: "users",     element: <AdminUsers /> },
        ],
      },
    ],
  },
]);
