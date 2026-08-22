/**
 * ImportTutorial.tsx
 * Importa un tutorial completo (secciones, lecciones y páginas) a partir de
 * archivos Markdown locales, sin copiar/pegar en TutorialEditor.tsx.
 *
 * Convención esperada en los .md: H1 = título del curso (opcional, solo se usa
 * como sugerencia), "## Módulo N · Título" = sección, H3 = título de la
 * lección/página. Archivos sin "## Módulo N" caen en una sección "Contenido".
 *
 * Reimportar sobre el mismo curso actualiza en lugar de duplicar: el backend
 * empareja secciones por (curso, order) y lecciones por (sección, slug), y el
 * slug se deriva del nombre de archivo — mientras el archivo se llame igual,
 * corregirlo localmente y volver a importar reemplaza el contenido existente.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UploadCloud, FileText, ArrowLeft, ArrowRight, Trash2,
  CheckCircle2, AlertCircle, ChevronRight, FolderTree,
} from "lucide-react";
import {
  tutorialUseCases,
  tutorialImportUseCases,
} from "../../../infrastructure/factories/tutorial-module.factory";
import type { TutorialStatus } from "../../../domain/entities/tutorial.entity";
import type { ImportTutorialPayload, ImportTutorialResult } from "../../../domain/ports/tutorial-import-repository.port";
import { parseTutorialFiles, suggestCourseTitle, type ParsedSection, type RawFile } from "./import-tutorial-parser";

const LEVELS = ["Principiante", "Intermedio", "Avanzado"];
type Step = "course" | "files" | "preview" | "done";

const NEW_COURSE_EMPTY = {
  title: "", description: "", level: "Principiante",
  status: "DRAFT" as TutorialStatus, is_public: false,
};

function readFilesAsText(fileList: FileList): Promise<RawFile[]> {
  const files = Array.from(fileList);
  return Promise.all(
    files.map(
      (file) =>
        new Promise<RawFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ filename: file.name, content: String(reader.result || "") });
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file, "UTF-8");
        })
    )
  );
}

export default function ImportTutorial() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("course");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [newCourse, setNewCourse] = useState(NEW_COURSE_EMPTY);
  const [rawFiles, setRawFiles] = useState<RawFile[]>([]);
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [result, setResult] = useState<ImportTutorialResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  const coursesQ = useQuery({
    queryKey: ["tutorials-for-import"],
    queryFn: () => tutorialUseCases.list({}),
    enabled: mode === "existing",
  });
  const courses = coursesQ.data?.data ?? [];

  const importM = useMutation({
    mutationFn: (payload: ImportTutorialPayload) => tutorialImportUseCases.import(payload),
    onSuccess: (res) => {
      setResult(res);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["tutorials"] });
    },
  });

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setReadError(null);
    try {
      const raw = await readFilesAsText(fileList);
      setRawFiles(raw);
      setSections(parseTutorialFiles(raw));
      if (mode === "new" && !newCourse.title) {
        const suggested = suggestCourseTitle(raw);
        if (suggested) setNewCourse((c) => ({ ...c, title: suggested }));
      }
      setStep("preview");
    } catch {
      setReadError("No se pudieron leer los archivos seleccionados.");
    }
  }

  function updateSection(idx: number, patch: Partial<ParsedSection>) {
    setSections((s) => s.map((sec, i) => (i === idx ? { ...sec, ...patch } : sec)));
  }
  function updateLesson(si: number, li: number, patch: Partial<ParsedSection["lessons"][number]>) {
    setSections((s) =>
      s.map((sec, i) =>
        i !== si ? sec : { ...sec, lessons: sec.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) }
      )
    );
  }
  function removeLesson(si: number, li: number) {
    setSections((s) =>
      s.map((sec, i) => (i !== si ? sec : { ...sec, lessons: sec.lessons.filter((_, j) => j !== li) })).filter((sec) => sec.lessons.length > 0)
    );
  }

  function handleConfirm() {
    const payload: ImportTutorialPayload =
      mode === "existing"
        ? { courseId: selectedCourseId, sections: toPayloadSections(sections) }
        : {
            course: {
              title: newCourse.title,
              description: newCourse.description || undefined,
              level: newCourse.level,
              status: newCourse.status,
              is_public: newCourse.is_public,
            },
            sections: toPayloadSections(sections),
          };
    importM.mutate(payload);
  }

  const canGoToFiles = mode === "existing" ? !!selectedCourseId : newCourse.title.trim().length > 0;
  const canConfirm = sections.length > 0 && sections.every((s) => s.lessons.length > 0);
  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontSize: ".9rem", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 };
  const card: React.CSSProperties = { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "24px 28px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <UploadCloud size={20} style={{ color: "var(--color-primary)" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
          Importar tutorial desde Markdown
        </h1>
      </div>

      {/* Paso 1: curso */}
      {step === "course" && (
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16, color: "var(--color-text)" }}>1. ¿A qué curso importas?</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <button type="button" onClick={() => setMode("new")} className={`btn ${mode === "new" ? "btn--primary" : "btn--outline"}`}>Nuevo curso</button>
            <button type="button" onClick={() => setMode("existing")} className={`btn ${mode === "existing" ? "btn--primary" : "btn--outline"}`}>Curso existente</button>
          </div>

          {mode === "new" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Título *</label><input type="text" value={newCourse.title} onChange={(e) => setNewCourse((c) => ({ ...c, title: e.target.value }))} style={inp} /></div>
              <div><label style={lbl}>Descripción</label><textarea rows={2} value={newCourse.description} onChange={(e) => setNewCourse((c) => ({ ...c, description: e.target.value }))} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Nivel</label>
                  <select value={newCourse.level} onChange={(e) => setNewCourse((c) => ({ ...c, level: e.target.value }))} style={inp}>
                    {LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Estado</label>
                  <select value={newCourse.status} onChange={(e) => setNewCourse((c) => ({ ...c, status: e.target.value as TutorialStatus }))} style={inp}>
                    <option value="DRAFT">Borrador</option>
                    <option value="PUBLISHED">Publicado</option>
                  </select>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={newCourse.is_public} onChange={(e) => setNewCourse((c) => ({ ...c, is_public: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--color-primary)" }} />
                <span style={{ fontSize: ".88rem", color: "var(--color-text)" }}>Acceso público</span>
              </label>
            </div>
          ) : (
            <div>
              <label style={lbl}>Curso *</label>
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={inp}>
                <option value="">Selecciona un curso…</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <p style={{ fontSize: ".8rem", color: "var(--color-text-muted)", marginTop: 8 }}>
                Si vuelves a importar los mismos archivos (mismo nombre) sobre este curso, el contenido existente se actualiza en lugar de duplicarse.
              </p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" disabled={!canGoToFiles} onClick={() => setStep("files")} className="btn btn--primary">
              Continuar <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: archivos */}
      {step === "files" && (
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16, color: "var(--color-text)" }}>2. Selecciona los archivos Markdown</h2>
          <label
            htmlFor="md-files-input"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
              padding: "40px 20px", cursor: "pointer", color: "var(--color-text-muted)",
            }}
          >
            <FileText size={28} />
            <span style={{ fontSize: ".9rem" }}>Haz clic para elegir uno o varios archivos .md</span>
            <input id="md-files-input" type="file" multiple accept=".md,.markdown,text/markdown" onChange={handleFilesSelected} style={{ display: "none" }} />
          </label>
          {readError && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", color: "#DC2626", fontSize: ".85rem" }}>
              <AlertCircle size={14} /> {readError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button type="button" onClick={() => setStep("course")} className="btn btn--outline"><ArrowLeft size={15} /> Volver</button>
          </div>
        </div>
      )}

      {/* Paso 3: vista previa editable */}
      {step === "preview" && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <FolderTree size={17} style={{ color: "var(--color-primary)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>3. Revisa la estructura detectada</h2>
          </div>
          <p style={{ fontSize: ".82rem", color: "var(--color-text-muted)", marginBottom: 18 }}>
            {rawFiles.length} archivo(s) → {sections.length} sección(es), {totalLessons} lección(es). Puedes corregir títulos, orden, o quitar una lección antes de importar.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map((section, si) => (
              <div key={si} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 14 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input type="number" value={section.order} onChange={(e) => updateSection(si, { order: Number(e.target.value) })} style={{ ...inp, width: 70 }} />
                  <input type="text" value={section.title} onChange={(e) => updateSection(si, { title: e.target.value })} style={{ ...inp, fontWeight: 700 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
                  {section.lessons.map((lesson, li) => (
                    <div key={lesson.filename} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ChevronRight size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                      <input type="number" value={lesson.order} onChange={(e) => updateLesson(si, li, { order: Number(e.target.value) })} style={{ ...inp, width: 60 }} />
                      <input type="text" value={lesson.title} onChange={(e) => updateLesson(si, li, { title: e.target.value })} style={inp} />
                      <span style={{ fontSize: ".75rem", color: "var(--color-text-muted)", flexShrink: 0, minWidth: 90 }}>{lesson.filename}</span>
                      <button type="button" title="Quitar" onClick={() => removeLesson(si, li)} style={{ background: "rgba(239,68,68,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 8px", color: "#DC2626", cursor: "pointer", flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {importM.isError && (
            <div style={{ marginTop: 16, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: ".82rem", color: "#DC2626" }}>
              Error al importar. Revisa los datos e intenta de nuevo.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button type="button" onClick={() => setStep("files")} className="btn btn--outline"><ArrowLeft size={15} /> Volver</button>
            <button type="button" disabled={!canConfirm || importM.isPending} onClick={handleConfirm} className="btn btn--primary">
              {importM.isPending ? "Importando…" : `Importar ${totalLessons} página(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: resultado */}
      {step === "done" && result && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <CheckCircle2 size={22} style={{ color: "#16A34A" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>Importación completada</h2>
          </div>
          <p style={{ fontSize: ".9rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
            Secciones: {result.sections.created} creadas, {result.sections.updated} actualizadas. Lecciones: {result.lessons.created} creadas, {result.lessons.updated} actualizadas.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to={`/admin/tutorials/${result.courseId}/edit`} className="btn btn--primary">Abrir editor <ChevronRight size={15} /></Link>
            <button type="button" onClick={() => navigate("/admin/tutorials")} className="btn btn--outline">Ir a la lista</button>
          </div>
        </div>
      )}
    </div>
  );
}

function toPayloadSections(sections: ParsedSection[]) {
  return sections.map((s) => ({
    title: s.title,
    order: s.order,
    lessons: s.lessons.map((l) => ({ slug: l.slug, title: l.title, order: l.order, markdown: l.markdown })),
  }));
}
