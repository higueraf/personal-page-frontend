import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit2, Trash2, BookOpen, ChevronRight,
  Search, RefreshCw, AlertCircle,
} from "lucide-react";
import { adminCourses, type AdminCourse, type CourseStatus } from "../api";
import Pagination from "../../shared/components/Pagination";

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: "Borrador",
  IN_REVIEW: "En revisión",
  PUBLISHED: "Publicado",
  HIDDEN: "Oculto",
  ARCHIVED: "Archivado",
};

const STATUS_CLASS: Record<CourseStatus, string> = {
  DRAFT: "badge--yellow",
  IN_REVIEW: "badge--blue",
  PUBLISHED: "badge--green",
  HIDDEN: "badge--yellow",
  ARCHIVED: "badge--red",
};

const EMPTY_FORM: Partial<AdminCourse> = {
  title: "",
  description: "",
  level: "",
  status: "DRAFT",
};

export default function AdminCourses() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminCourse>>(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── List ──────────────────────────────────────────────────────────
  const listQ = useQuery({
    queryKey: ["admin-courses", search, page],
    queryFn: () => adminCourses.list({ search: search || undefined, page }),
    placeholderData: (prev) => prev,
  });

  const courses = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  // ── Mutations ──────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-courses"] });

  const createM = useMutation({
    mutationFn: (body: Partial<AdminCourse>) => adminCourses.create(body),
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const updateM = useMutation({
    mutationFn: ({ pk, body }: { pk: string; body: Partial<AdminCourse> }) =>
      adminCourses.update(pk, body),
    onSuccess: () => { invalidate(); closeModal(); },
  });

  const deleteM = useMutation({
    mutationFn: (pk: string) => adminCourses.delete(pk),
    onSuccess: () => { invalidate(); setDeleteId(null); },
  });

  // ── Handlers ──────────────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  }

  function openEdit(c: AdminCourse) {
    setForm({ title: c.title, description: c.description ?? "", level: c.level ?? "", status: c.status });
    setEditing(c.id);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setForm(EMPTY_FORM);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === "edit" && editing) {
      updateM.mutate({ pk: editing, body: form });
    } else {
      createM.mutate(form);
    }
  }

  const isBusy = createM.isPending || updateM.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            Gestionar Cursos
          </h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <Plus size={15} /> Nuevo curso
        </button>
      </div>

      {/* Búsqueda */}
      <div style={{ position: "relative", maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-sub)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Buscar por título…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            width: "100%", padding: "8px 10px 8px 32px",
            background: "var(--color-bg-muted)",
            border: "1.5px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text)", fontSize: ".88rem",
            fontFamily: "var(--font-body)", outline: "none",
          }}
        />
      </div>

      {/* Estado de carga / error */}
      {listQ.isLoading && (
        <div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: ".82rem", display: "flex", alignItems: "center", gap: 8 }}>
          <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Cargando…
        </div>
      )}
      {listQ.isError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: ".88rem" }}>
          <AlertCircle size={16} /> Error al cargar cursos.
        </div>
      )}

      {/* Tabla */}
      {!listQ.isLoading && courses.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: .3 }} />
          <p>{search ? `Sin resultados para "${search}"` : "Aún no hay cursos. ¡Crea el primero!"}</p>
        </div>
      )}

      {courses.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {courses.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--color-bg-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--color-text)" }}>
                    {c.title}
                  </span>
                  <span className={`badge ${STATUS_CLASS[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                  {c.level && (
                    <span className="badge badge--blue">{c.level}</span>
                  )}
                </div>
                {c.description && (
                  <p style={{ fontSize: ".82rem", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>
                    {c.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Link
                  to={`/admin/courses/${c.id}/sections`}
                  className="nav-pill"
                  style={{ fontSize: ".8rem", gap: 4 }}
                >
                  Secciones <ChevronRight size={12} />
                </Link>
                <button
                  title="Editar"
                  onClick={() => openEdit(c)}
                  style={{
                    background: "rgba(26,63,168,.08)", border: "none",
                    borderRadius: "var(--radius-sm)", padding: "7px 9px",
                    color: "var(--color-primary)", cursor: "pointer",
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  title="Eliminar"
                  onClick={() => setDeleteId(c.id)}
                  style={{
                    background: "rgba(239,68,68,.08)", border: "none",
                    borderRadius: "var(--radius-sm)", padding: "7px 9px",
                    color: "#DC2626", cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={meta?.total_records}
        itemLabel="cursos"
      />

      {/* ── Modal crear / editar ── */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 16,
        }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 32px",
            width: "100%", maxWidth: 520,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "var(--shadow-lg)",
          }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-text)", marginBottom: 20 }}>
              {modal === "edit" ? "Editar curso" : "Nuevo curso"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Título *", key: "title", type: "text", required: true },
                { label: "Nivel", key: "level", type: "text", required: false },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 }}>{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={(form as any)[key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "9px 12px",
                      background: "var(--color-bg-muted)",
                      border: "1.5px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-text)", fontSize: ".9rem",
                      fontFamily: "var(--font-body)", outline: "none",
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 }}>Descripción</label>
                <textarea
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  style={{
                    width: "100%", padding: "9px 12px",
                    background: "var(--color-bg-muted)",
                    border: "1.5px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text)", fontSize: ".9rem",
                    fontFamily: "var(--font-body)", outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 }}>Estado</label>
                <select
                  value={form.status ?? "DRAFT"}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CourseStatus }))}
                  style={{
                    width: "100%", padding: "9px 12px",
                    background: "var(--color-bg-muted)",
                    border: "1.5px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text)", fontSize: ".9rem",
                    fontFamily: "var(--font-body)", outline: "none",
                  }}
                >
                  {(Object.entries(STATUS_LABELS) as [CourseStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {(createM.isError || updateM.isError) && (
                <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: ".82rem", color: "#DC2626" }}>
                  Error al guardar. Revisa los datos.
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={closeModal} className="btn btn--outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={isBusy} style={{ flex: 1, justifyContent: "center" }}>
                  {isBusy ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar ── */}
      {deleteId && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 16,
        }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "28px 32px",
            maxWidth: 380, width: "100%",
            boxShadow: "var(--shadow-lg)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertCircle size={20} style={{ color: "#DC2626" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text)" }}>
                Eliminar curso
              </h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: ".9rem", marginBottom: 20 }}>
              Esta acción no se puede deshacer. ¿Confirmas la eliminación?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn--outline" onClick={() => setDeleteId(null)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button
                onClick={() => deleteM.mutate(deleteId)}
                disabled={deleteM.isPending}
                style={{
                  flex: 1, background: "#DC2626", color: "#fff",
                  border: "none", borderRadius: "var(--radius-md)",
                  padding: "10px", fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: ".9rem",
                }}
              >
                {deleteM.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
