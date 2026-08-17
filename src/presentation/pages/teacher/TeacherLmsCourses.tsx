import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Archive, GraduationCap, Plus, Search, Settings2 } from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type { LmsCourse } from "../../../domain/entities/lms.entity";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import EmptyState from "@/presentation/components/patterns/EmptyState";
import DataTable, { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/patterns/DataTable";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Badge } from "@/presentation/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/presentation/components/ui/dialog";

const STATUS_LABEL: Record<string, string> = { DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado" };
const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

export default function TeacherLmsCourses() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const coursesQ = useQuery({
    queryKey: ["lms-teacher-courses", search],
    queryFn: () => lmsUseCases.listForTeacher({ search: search || undefined }),
  });
  const courses = coursesQ.data?.data ?? [];

  const createM = useMutation({
    mutationFn: () => lmsUseCases.createCourse(form),
    onSuccess: (course: LmsCourse) => {
      qc.invalidateQueries({ queryKey: ["lms-teacher-courses"] });
      setCreateOpen(false);
      setForm({ title: "", description: "" });
      nav(`/teacher/cursos/${course.id}`);
    },
  });

  const archiveM = useMutation({
    mutationFn: (id: string) => lmsUseCases.archiveCourse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-teacher-courses"] }),
  });

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="Mis cursos académicos"
        subtitle="Crea cursos, organízalos en unidades y publica actividades para tus alumnos."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Nuevo curso
          </Button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por título…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {!coursesQ.isLoading && courses.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="Todavía no tienes cursos."
          description="Crea el primero para empezar a publicar unidades y actividades."
        />
      )}

      {courses.length > 0 && (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{c.title}</div>
                  {c.description && <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.description}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/teacher/cursos/${c.id}`}>
                        <Settings2 size={14} /> Gestionar
                      </Link>
                    </Button>
                    {c.status !== "ARCHIVED" && (
                      <Button size="sm" variant="ghost" onClick={() => archiveM.mutate(c.id)} disabled={archiveM.isPending}>
                        <Archive size={14} /> Archivar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo curso</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              createM.mutate();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Título *</label>
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Descripción</label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">
              El curso se crea como borrador. Podrás agregar unidades y actividades, y publicarlo cuando esté listo.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createM.isPending}>
                {createM.isPending ? "Creando…" : "Crear curso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
