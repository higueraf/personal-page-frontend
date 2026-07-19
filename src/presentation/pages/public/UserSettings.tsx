import { useState } from "react";
import { Lock, Save, RefreshCw, AlertCircle } from "lucide-react";
import { changePasswordUseCase } from "../../../infrastructure/factories/auth.factory";
import FormCard from "@/presentation/components/patterns/FormCard";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Button } from "@/presentation/components/ui/button";
import { Separator } from "@/presentation/components/ui/separator";

export default function UserSettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (form.new_password !== form.confirm_password) {
      setError("Las contraseñas nuevas no coinciden");
      setLoading(false);
      return;
    }

    try {
      await changePasswordUseCase.execute({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al cambiar la contraseña. Verifica tu contraseña actual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard
      icon={<Lock size={22} />}
      title="Configuración de Seguridad"
      description="Actualiza tu contraseña para mantener tu cuenta protegida."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Contraseña Actual</Label>
          <Input
            id="current_password"
            type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="new_password">Nueva Contraseña</Label>
          <Input
            id="new_password"
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
          <Input
            id="confirm_password"
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            placeholder="Repite tu nueva contraseña"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
            ✓ Tu contraseña ha sido cambiada con éxito.
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? "Procesando..." : "Actualizar Contraseña"}
        </Button>
      </form>

      <div className="rounded-md border border-border bg-muted p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Consejos de seguridad</h4>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
          <li>Usa una mezcla de letras, números y símbolos.</li>
          <li>No uses contraseñas fáciles de adivinar (como "123456").</li>
          <li>Asegúrate de que sea diferente a la que usas en otros sitios.</li>
        </ul>
      </div>
    </FormCard>
  );
}
