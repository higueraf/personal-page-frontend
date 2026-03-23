import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle, XCircle, Clock, Ban, ChevronDown, Search, RefreshCw } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";

// ── Tipos ──────────────────────────────────────────────────────────────────────

type UserStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  is_active: boolean;
  role: { id: string; name: string } | null;
  created_at: string;
}

interface Role { id: string; name: string; }

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchUsers(params: { status?: string; search?: string; page: number }) {
  const p: Record<string, any> = { page: params.page, page_size: 30 };
  if (params.status) p.status = params.status;
  if (params.search) p.search = params.search;
  const r = await http.get("/admin/users", { params: p });
  return r.data as { data: AdminUser[]; meta: { total_records: number; page: number; page_size: number } };
}

async function fetchRoles() {
  const r = await http.get("/admin/users/roles");
  return r.data.data as Role[];
}

async function patchUser(id: string, body: { status?: UserStatus; role_id?: string }) {
  const r = await http.patch(`/admin/users/${id}`, body);
  return r.data.data as AdminUser;
}

// ── Helpers visuales ───────────────────────────────────────────────────────────

const STATUS_META: Record<UserStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pendiente",  color: "#f59e0b", bg: "rgba(245,158,11,.1)",  icon: <Clock       size={13}/> },
  APPROVED:  { label: "Aprobado",   color: "#22c55e", bg: "rgba(34,197,94,.1)",   icon: <CheckCircle size={13}/> },
  SUSPENDED: { label: "Suspendido", color: "#f97316", bg: "rgba(249,115,22,.1)",  icon: <Ban         size={13}/> },
  REJECTED:  { label: "Rechazado",  color: "#ef4444", bg: "rgba(239,68,68,.1)",   icon: <XCircle     size={13}/> },
};

function StatusBadge({ status }: { status: UserStatus }) {
  const m = STATUS_META[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99,
      background: m.bg, color: m.color,
      fontSize: ".75rem", fontWeight: 600,
    }}>
      {m.icon} {m.label}
    </span>
  );
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [page,         setPage]         = useState(1);
  const [editing,      setEditing]      = useState<AdminUser | null>(null);
  const [newStatus,    setNewStatus]    = useState<UserStatus>("APPROVED");
  const [newRoleId,    setNewRoleId]    = useState<string>("");

  const usersQ = useQuery({
    queryKey: ["admin-users", statusFilter, search, page],
    queryFn:  () => fetchUsers({ status: statusFilter || undefined, search: search || undefined, page }),
  });

  const rolesQ = useQuery({ queryKey: ["admin-roles"], queryFn: fetchRoles });

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: UserStatus; role_id?: string } }) =>
      patchUser(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditing(null);
    },
  });

  const users   = usersQ.data?.data ?? [];
  const meta    = usersQ.data?.meta;
  const roles   = rolesQ.data ?? [];
  const pending = users.filter((u) => u.status === "PENDING").length;

  function openEdit(u: AdminUser) {
    setEditing(u);
    setNewStatus(u.status);
    setNewRoleId(u.role?.id ?? "");
  }

  function applyEdit() {
    if (!editing) return;
    mutation.mutate({
      id: editing.id,
      body: {
        status:  newStatus,
        role_id: newRoleId || undefined,
      },
    });
  }

  function quickApprove(u: AdminUser) {
    mutation.mutate({ id: u.id, body: { status: "APPROVED" } });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            Usuarios
          </h1>
          {pending > 0 && (
            <span style={{
              background: "rgba(245,158,11,.15)", color: "#f59e0b",
              border: "1px solid rgba(245,158,11,.3)",
              padding: "2px 9px", borderRadius: 99, fontSize: ".75rem", fontWeight: 700,
            }}>
              {pending} pendiente{pending > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar…"
                style={{ ...inputStyle, paddingLeft: 28, width: 180 }}
              />
            </div>
            <button type="submit" style={btnSecondary}>Buscar</button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={inputStyle}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {usersQ.isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "32px", color: "var(--color-text-muted)" }}>
            <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Cargando…
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: ".9rem" }}>
            No hay usuarios con los filtros actuales.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-muted)" }}>
                {["Nombre", "Email", "Rol", "Estado", "Registro", "Acciones"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: ".88rem" }}>
                      {u.first_name} {u.last_name}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem", color: "var(--color-text-muted)" }}>
                      {u.email}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: "var(--color-bg-muted)", border: "1px solid var(--color-border)",
                      padding: "2px 8px", borderRadius: 99, fontSize: ".75rem",
                      color: "var(--color-text-muted)", fontWeight: 500,
                    }}>
                      {u.role?.name ?? "—"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={u.status} />
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: ".78rem", color: "var(--color-text-muted)" }}>
                      {new Date(u.created_at).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, display: "flex", gap: 6, alignItems: "center" }}>
                    {u.status === "PENDING" && (
                      <button
                        onClick={() => quickApprove(u)}
                        disabled={mutation.isPending}
                        style={{ ...btnPrimary, fontSize: ".75rem", padding: "4px 10px" }}
                      >
                        Aprobar
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(u)}
                      style={{ ...btnSecondary, fontSize: ".75rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      Editar <ChevronDown size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={meta?.total_records}
        itemLabel="usuarios"
      />

      {/* Modal de edición */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 24,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "32px 28px",
            width: "100%", maxWidth: 420,
          }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", marginBottom: 4 }}>
              Editar usuario
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: ".85rem", marginBottom: 22 }}>
              {editing.first_name} {editing.last_name} · <span style={{ fontFamily: "var(--font-mono)" }}>{editing.email}</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="APPROVED">Aprobado</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Rol</label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="">— Sin cambio —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {mutation.isError && (
              <p style={{ color: "#ef4444", fontSize: ".82rem", marginTop: 10 }}>
                Ocurrió un error. Intenta de nuevo.
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={btnSecondary}>Cancelar</button>
              <button
                onClick={applyEdit}
                disabled={mutation.isPending}
                style={{ ...btnPrimary, opacity: mutation.isPending ? .7 : 1 }}
              >
                {mutation.isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos compartidos ────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left",
  fontSize: ".72rem", fontWeight: 700,
  color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 14px", fontSize: ".85rem", color: "var(--color-text)",
  verticalAlign: "middle",
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-muted)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "7px 10px",
  fontSize: ".83rem",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  background: "var(--color-primary)", color: "#fff",
  border: "none", borderRadius: "var(--radius-md)",
  padding: "7px 14px", fontSize: ".83rem", fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "var(--color-bg-muted)", color: "var(--color-text)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  padding: "7px 14px", fontSize: ".83rem",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: ".8rem", fontWeight: 600,
  color: "var(--color-text-muted)", marginBottom: 5,
};
