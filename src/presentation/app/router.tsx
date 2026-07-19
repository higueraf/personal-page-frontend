import { createBrowserRouter } from "react-router-dom";
import { RequireAuth }   from "../auth/RequireAuth";
import { RequireAdmin }  from "../auth/RequireAdmin";
import PublicLayout      from "./PublicLayout";

// ── Páginas públicas ──────────────────────────────────────────────────────────
import Home              from "../pages/public/Home";
import Login             from "../pages/public/Login";
import Register          from "../pages/public/Register";
import ForgotPassword    from "../pages/public/ForgotPassword";
import ResetPassword     from "../pages/public/ResetPassword";
import TutorialsList     from "../pages/public/TutorialsList";
import TutorialViewer    from "../pages/public/TutorialViewer";
import VideosCoursesList from "../pages/public/VideosCoursesList";
import CourseViewer      from "../pages/public/CourseViewer";
import ProjectsList      from "../pages/public/ProjectsList";
import ProjectDetail     from "../pages/public/ProjectDetail";
import About             from "../pages/public/About";
import Resources         from "../pages/public/Resources";
import Contact           from "../pages/public/Contact";
import UserProfile       from "../pages/public/UserProfile";
import UserSettings      from "../pages/public/UserSettings";
import PlaygroundList     from "../pages/public/Playground/PlaygroundList";
import PlaygroundIDE      from "../pages/public/Playground/PlaygroundIDE";

// ── Páginas admin ─────────────────────────────────────────────────────────────
import AdminLayout       from "../layout/AdminLayout";
import AdminDashboard    from "../pages/admin/AdminDashboard";
import AdminTutorials    from "../pages/admin/AdminTutorials";
import TutorialEditor    from "../pages/admin/TutorialEditor";
import AdminVideoCourses from "../pages/admin/AdminVideoCourses";
import CourseEditor      from "../pages/admin/CourseEditor";
import AdminUsers        from "../pages/admin/AdminUsers";
import AdminInstitutions   from "../pages/admin/AdminInstitutions";
import AdminStudyCourses   from "../pages/admin/AdminStudyCourses";
import AdminProjects     from "../pages/admin/AdminProjects";
import AdminProfile      from "../pages/admin/AdminProfile";
import AdminResources    from "../pages/admin/AdminResources";
import AdminContact      from "../pages/admin/AdminContact";
import AdminAssignments  from "../pages/admin/AdminAssignments";
import AdminPlaygrounds  from "../pages/admin/AdminPlaygrounds";

export const router = createBrowserRouter([
  // ── Público ───────────────────────────────────────────────────────────────
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true,  element: <Home /> },
      { path: "login",           element: <Login /> },
      { path: "register",        element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password",  element: <ResetPassword /> },

      { path: "tutorials",             element: <TutorialsList /> },
      { path: "tutorials/:courseSlug", element: <TutorialViewer /> },

      { path: "courses",               element: <VideosCoursesList /> },
      { path: "courses/:courseSlug",   element: <CourseViewer /> },

      { path: "projects",              element: <ProjectsList /> },
      { path: "projects/:slug",        element: <ProjectDetail /> },

      { path: "about",     element: <About /> },
      { path: "resources", element: <Resources /> },
      { path: "contact",   element: <Contact /> },

      // Rutas protegidas de cuenta (dentro de PublicLayout)
      {
        element: <RequireAuth />,
        children: [
          { path: "profile",  element: <UserProfile /> },
          { path: "settings", element: <UserSettings /> },
          { path: "playground", element: <PlaygroundList /> },
        ]
      }
    ],
  },

  // ── Playground IDE (full-screen, sin navbar) ─────────────────────────────
  {
    element: <RequireAuth />,
    children: [
      { path: "/playground/:id", element: <PlaygroundIDE /> },
    ],
  },

  { path: "/admin/login", element: <Login /> },

  // ── Admin protegido (solo rol admin) ───────────────────────────────────────
  {
    path: "/admin",
    element: <RequireAdmin />,
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
          { path: "assignments", element: <AdminAssignments /> },
          { path: "playgrounds", element: <AdminPlaygrounds /> },
          { path: "institutions", element: <AdminInstitutions /> },
          { path: "study-courses", element: <AdminStudyCourses /> },
          { path: "users",     element: <AdminUsers /> },
        ],
      },
    ],
  },
]);
