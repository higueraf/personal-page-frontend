import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { playgroundUseCases } from "../../../../infrastructure/factories/playground-module.factory";

/**
 * Shared link for a whole exam (used as the SEB `startURL`): resolves the
 * currently logged-in student's own project within the exam's `exam_group_id`
 * and redirects them there. The same URL works for every student in the exam.
 */
export default function PlaygroundExamGroupRedirect() {
  const { groupId } = useParams<{ groupId: string }>();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    playgroundUseCases
      .getMyProjectInExamGroup(groupId)
      .then(setProjectId)
      .catch(() => setError("No se encontró un examen asignado para tu usuario en este grupo."));
  }, [groupId]);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, textAlign: "center" }}>
        <p>{error}</p>
      </div>
    );
  }

  if (projectId) {
    return <Navigate to={`/playground/${projectId}`} replace />;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Loader2 className="animate-spin" size={32} />
    </div>
  );
}
