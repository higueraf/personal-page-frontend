import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/presentation/lib/utils";
import type { CardAccent } from "./CourseCard";

const ACCENT_CIRCLE: Record<CardAccent, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-emerald-500/10 text-emerald-600",
  purple: "bg-violet-500/10 text-violet-600",
  orange: "bg-amber-500/10 text-amber-600",
  pink: "bg-pink-500/10 text-pink-600",
};

const ACCENT_ORDER: CardAccent[] = ["blue", "green", "purple", "orange", "pink"];

interface CategoryCardProps {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  accent?: CardAccent;
  className?: string;
}

/** Card de categoría estilo Edution (icono de color + label + contador) para grids de categorías. */
export default function CategoryCard({ to, icon: Icon, label, count, accent = "blue", className }: CategoryCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", ACCENT_CIRCLE[accent])}>
        <Icon size={26} />
      </div>
      <div>
        <div className="font-medium text-foreground">{label}</div>
        {typeof count === "number" && (
          <div className="text-xs text-muted-foreground">{count} recursos</div>
        )}
      </div>
    </Link>
  );
}

export { ACCENT_ORDER };
