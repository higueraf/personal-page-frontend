import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatColor = "primary" | "blue" | "green" | "yellow" | "red";

const COLOR_MAP: Record<StatColor, string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-emerald-500/10 text-emerald-600",
  yellow: "bg-amber-500/10 text-amber-600",
  red: "bg-red-500/10 text-red-600",
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: StatColor;
  className?: string;
}

/** Stat card estilo UStudy: círculo de icono de color + número + label. */
export default function StatCard({ icon: Icon, label, value, color = "primary", className }: StatCardProps) {
  return (
    <Card className={cn("flex items-center gap-4 p-5", className)}>
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", COLOR_MAP[color])}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}
