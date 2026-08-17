import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth }     from "../auth/RequireAuth";
import { RequireAuthExam } from "../auth/RequireAuthExam";
import { RequireAdmin }    from "../auth/RequireAdmin";
import { RequireTeacher }  from "../auth/RequireTeacher";
import { ExamLockGate }    from "../auth/ExamLockGate";
import PublicLayout      from "./PublicLayout";
import TeacherLayout     from "../layout/TeacherLayout";

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
import PlaygroundExamGroupRedirect from "../pages/public/Playground/PlaygroundExamGroupRedirect";
import SebQuit from "../pages/public/Playground/SebQuit";
import ExamLogin from "../pages/public/Playground/ExamLogin";
import LmsCatalog        from "../pages/public/LmsCatalog";
import LmsCourseDetail   from "../pages/public/LmsCourseDetail";
import LmsMyCourses      from "../pages/public/LmsMyCourses";
import LmsActivityViewer from "../pages/public/LmsActivityViewer";

// ── Páginas del profesor (LMS académico) ─────────────────────────────────────
import TeacherLmsCourses       from "../pages/teacher/TeacherLmsCourses";
import TeacherLmsCourseEditor  from "../pages/teacher/TeacherLmsCourseEditor";

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
import AdminPlaygroundTemplates from "../pages/admin/AdminPlaygroundTemplates";
import AdminExamTemplates from "../pages/admin/AdminExamTemplates";

export const router = createBrowserRouter([
  // ── Bloqueo de navegación durante examen SEB activo (envuelve todo) ────────
  {
    element: <ExamLockGate />,
    children: [
      // ── Público ───────────────────────────────────────────────────────────
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

          { path: "lms",        element: <LmsCatalog /> },
          { path: "lms/:slug",  element: <LmsCourseDetail /> },

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

              { path: "lms/mis-cursos",             element: <LmsMyCourses /> },
              { path: "lms/actividades/:activityId", element: <LmsActivityViewer /> },
            ]
          }
        ],
      },

      // ── Playground IDE (full-screen, sin navbar) ─────────────────────────
      {
        element: <RequireAuthExam />,
        children: [
          { path: "/playground/exam/:groupId", element: <PlaygroundExamGroupRedirect /> },
          { path: "/playground/:id", element: <PlaygroundIDE /> },
        ],
      },

      // Login minimalista exclusivo para el flujo de examen vía SEB (sin
      // enlaces a ninguna otra sección de la plataforma).
      { path: "/exam-login", element: <ExamLogin /> },

      { path: "/admin/login", element: <Login /> },

      // Target of the SEB `quitURL` — SEB intercepts navigation here and closes itself.
      { path: "/seb-quit", element: <SebQuit /> },

      // ── Panel de profesor (LMS académico: admin o teacher) ───────────────
      {
        path: "/teacher",
        element: <RequireTeacher />,
        children: [
          {
            path: "",
            element: <TeacherLayout />,
            children: [
              { index: true, element: <Navigate to="/teacher/cursos" replace /> },
              { path: "cursos", element: <TeacherLmsCourses /> },
              { path: "cursos/:courseId", element: <TeacherLmsCourseEditor /> },
            ],
          },
        ],
      },

      // ── Admin protegido (solo rol admin) ─────────────────────────────────
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
              { path: "playground-templates", element: <AdminPlaygroundTemplates /> },
              { path: "exam-templates", element: <AdminExamTemplates /> },
              { path: "institutions", element: <AdminInstitutions /> },
              { path: "study-courses", element: <AdminStudyCourses /> },
              { path: "users",     element: <AdminUsers /> },
            ],
          },
        ],
      },
    ],
  },
]);
