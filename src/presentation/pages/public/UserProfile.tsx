import { useState, useEffect, useRef } from "react";
import { useAuth, avatarUrl } from "../../store/auth.store";
import { User, Save, Mail, Shield, RefreshCw, Camera } from "lucide-react";
import { updateProfileUseCase, uploadAvatarUseCase } from "../../../infrastructure/factories/auth.factory";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/presentation/components/ui/avatar";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/presentation/lib/utils";

export default function UserProfile() {
  const { user, bootstrap } = useAuth();
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ first_name: "", last_name: "" });

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name || "", last_name: user.last_name || "" });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfileUseCase.execute(form);
      await bootstrap();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    setPreview(URL.createObjectURL(file));

    setAvatarLoading(true);
    try {
      await uploadAvatarUseCase.execute(file);
      await bootstrap();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al subir la foto");
      setPreview(null);
    } finally {
      setAvatarLoading(false);
      // Reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  const currentAvatar = preview ?? avatarUrl(user.avatar);
  const initials = (user.first_name ? user.first_name.charAt(0) : user.email.charAt(0)).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader icon={User} title="Mi Perfil" />

      <div className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Lado izquierdo: Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-primary">Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Tu apellido"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email (No editable)</Label>
                <div className="flex cursor-not-allowed items-center gap-2.5 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Mail size={16} className="opacity-50" />
                  <span className="opacity-70">{user.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Rol actual</Label>
                <div>
                  <Badge variant="secondary" className="gap-1.5 rounded-full font-normal">
                    <Shield size={14} />
                    {user.role?.name || "Usuario"}
                  </Badge>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                  ¡Perfil actualizado correctamente!
                </div>
              )}

              <Button type="submit" disabled={loading} className="self-start">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lado derecho: Avatar + resumen */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              {/* Avatar clickeable */}
              <div
                className="group relative mx-auto mb-4 w-24 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Haz clic para cambiar tu foto"
              >
                <Avatar className="h-24 w-24 border-4 border-card shadow ring-1 ring-border">
                  {currentAvatar && (
                    <AvatarImage
                      src={currentAvatar}
                      alt="Avatar"
                      onError={() => setPreview(null)}
                    />
                  )}
                  <AvatarFallback className="text-2xl font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Overlay on hover */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full bg-black/45 transition-opacity",
                    avatarLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  {avatarLoading
                    ? <RefreshCw size={22} className="animate-spin text-white" />
                    : <Camera size={22} className="text-white" />
                  }
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <h3 className="font-display text-xl font-bold text-primary">
                {user.first_name} {user.last_name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Haz clic en la foto para cambiarla (máx. 5 MB)
              </p>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-dashed border-primary bg-primary/5 p-5">
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              <strong>Nota:</strong> Los cambios realizados aquí se verán reflejados en todo el sitio, incluyendo tus comentarios en tutoriales y tu perfil de estudiante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
