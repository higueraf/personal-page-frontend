import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, RefreshCw, Plus, Edit2, Trash2, Building2 } from "lucide-react";
import http from "../../shared/api/http";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Institution { id: string; name: string; }
interface StudyCourse { id: string; name: string; description?: string; institution?: Institution | null; created_at: string; }

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchCourses(institution_id?: string) {
  const params: any = {};
  if (institution_id) params.institution_id = institution_id;
  const r = await http.get("/admin/study-courses", { params });
  return r.data.data as StudyCourse[];
}

async function fetchInstitutions() {
  const r = await http.get("/admin/institutions");
  return r.data.data as Institution[];
}

async function createCourse(body: { name: string; description?: string; institution_id?: string }) {
  const r = await http.post("/admin/study-courses", body);
  return r.data.data as StudyCourse;
}

async function updateCourse(data: { id: string; body: { name?: string; description?: string; institution_id?: string | null } }) {
  const r = await http.patch(`/admin/study-courses/${data.id}`, data.body);
  return r.data.data as StudyCourse;
}

async function deleteCourse(id: string) {
  await http.delete(`/admin/study-courses/${id}`);
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AdminStudyCourses() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newInstId, setNewInstId] = useState("");
  const [filterInstId, setFilterInstId] = useState("");

  const coursesQ = useQuery({ queryKey: ["admin-study-courses", filterInstId], queryFn: () => fetchCourses(filterInstId) });
  const instQ = useQuery({ queryKey: ["admin-institutions"], queryFn: fetchInstitutions });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-study-courses"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-study-courses"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-study-courses"] }),
  });

  function openCreate() {
    setEditingId(null);
    setNewName("");
    setNewDesc("");
    setNewInstId("");
    setIsModalOpen(true);
  }

  function openEdit(course: StudyCourse) {
    setEditingId(course.id);
    setNewName(course.name);
    setNewDesc(course.description || "");
    setNewInstId(course.institution?.id || "");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        body: {
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          institution_id: newInstId || null,
        }
      });
    } else {
      createMutation.mutate({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        institution_id: newInstId || undefined,
      });
    }
  }

  const list = coursesQ.data || [];
  const institutions = instQ.data || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            Cursos / Carreras
          </h1>
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
          <select value={filterInstId} onChange={e => setFilterInstId(e.target.value)} style={inputStyle}>
            <option value="">Todas las instituciones</option>
            {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <button onClick={openCreate} style={{ ...btnPrimary, display: "flex", gap: 6, alignItems: "center" }}>
            <Plus size={14} /> Nuevo
          </button>
        </div>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {coursesQ.isLoading ? (
          <div style={{ padding: 32, display: "flex", gap: 8, color: "var(--color-text-muted)" }}>
            <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Cargando...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)", fontSize: ".9rem" }}>
            No hay cursos registrados.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-muted)", textAlign: "left" }}>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Institución</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={tdStyle}><strong>{c.name}</strong></td>
                  <td style={tdStyle}>
                    {c.institution ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".8rem", color: "var(--color-text-muted)" }}>
                        <Building2 size={12} /> {c.institution.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: ".8rem" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}><span style={{ color: "var(--color-text-muted)", fontSize: ".8rem" }}>{c.description || "—"}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEdit(c)}
                        style={{ ...btnSecondary, padding: "4px 8px" }}
                        title="Editar curso"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => { if(confirm("¿Eliminar curso?")) deleteMutation.mutate(c.id); }}
                        style={{ ...btnSecondary, padding: "4px 8px", color: "#ef4444" }}
                        title="Eliminar curso"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Curso */}
      {isModalOpen && (
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={modalContent}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
              {editingId ? "Editar Curso/Carrera" : "Nuevo Curso o Carrera"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Institución (Opcional)</label>
                <select value={newInstId} onChange={e => setNewInstId(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                  <option value="">— Sin institución vinculada —</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ ...inputStyle, width: "100%", height: 60 }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={closeModal} style={btnSecondary}>Cancelar</button>
                <button type="submit" disabled={isSaving} style={btnPrimary}>
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos (mismos que AdminUsers) ──
const thStyle: React.CSSProperties = { padding: "10px 14px", fontSize: ".72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" };
const tdStyle: React.CSSProperties = { padding: "11px 14px", fontSize: ".85rem", color: "var(--color-text)", verticalAlign: "middle" };
const inputStyle: React.CSSProperties = { background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "7px 10px", fontSize: ".83rem", color: "var(--color-text)", fontFamily: "inherit" };
const btnPrimary: React.CSSProperties = { background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "7px 14px", fontSize: ".83rem", fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { background: "var(--color-bg-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "7px 14px", fontSize: ".83rem", cursor: "pointer" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: ".8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 };
const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 };
const modalContent: React.CSSProperties = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", width: "100%", maxWidth: 400 };
