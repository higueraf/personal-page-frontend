import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, RefreshCw, Plus, Edit2, Trash2 } from "lucide-react";
import http from "../../shared/api/http";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Institution { id: string; name: string; description?: string; created_at: string; }

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchInstitutions() {
  const r = await http.get("/admin/institutions");
  return r.data.data as Institution[];
}

async function createInstitution(body: { name: string; description?: string }) {
  const r = await http.post("/admin/institutions", body);
  return r.data.data as Institution;
}

async function updateInstitution(data: { id: string; body: { name?: string; description?: string } }) {
  const r = await http.patch(`/admin/institutions/${data.id}`, data.body);
  return r.data.data as Institution;
}

async function deleteInstitution(id: string) {
  await http.delete(`/admin/institutions/${id}`);
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AdminInstitutions() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const instQ = useQuery({ queryKey: ["admin-institutions"], queryFn: fetchInstitutions });

  const createMutation = useMutation({
    mutationFn: createInstitution,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-institutions"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateInstitution,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-institutions"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInstitution,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-institutions"] }),
  });

  function openCreate() {
    setEditingId(null);
    setNewName("");
    setNewDesc("");
    setIsModalOpen(true);
  }

  function openEdit(inst: Institution) {
    setEditingId(inst.id);
    setNewName(inst.name);
    setNewDesc(inst.description || "");
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
      updateMutation.mutate({ id: editingId, body: { name: newName.trim(), description: newDesc.trim() || undefined } });
    } else {
      createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined });
    }
  }

  const list = instQ.data || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            Instituciones
          </h1>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: "flex", gap: 6, alignItems: "center" }}>
          <Plus size={14} /> Nueva
        </button>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {instQ.isLoading ? (
          <div style={{ padding: 32, display: "flex", gap: 8, color: "var(--color-text-muted)" }}>
            <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Cargando...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)", fontSize: ".9rem" }}>
            No hay instituciones.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-muted)", textAlign: "left" }}>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={tdStyle}><strong>{i.name}</strong></td>
                  <td style={tdStyle}><span style={{ color: "var(--color-text-muted)", fontSize: ".8rem" }}>{i.description || "—"}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEdit(i)}
                        style={{ ...btnSecondary, padding: "4px 8px" }}
                        title="Editar institución"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => { if(confirm("¿Eliminar?")) deleteMutation.mutate(i.id); }}
                        style={{ ...btnSecondary, padding: "4px 8px", color: "#ef4444" }}
                        title="Eliminar institución"
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

      {isModalOpen && (
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={modalContent}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
              {editingId ? "Editar Institución" : "Nueva Institución"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
