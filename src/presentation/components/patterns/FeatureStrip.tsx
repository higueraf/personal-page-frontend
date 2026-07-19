import type { LucideIcon } from "lucide-react";
import { cn } from "@/presentation/lib/utils";
import type { CardAccent } from "./CourseCard";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureStripProps {
  items: FeatureItem[];
}

const ACCENT_CYCLE: CardAccent[] = ["blue", "green", "purple", "orange", "pink"];

const ACCENT_ICON: Record<CardAccent, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-emerald-500/10 text-emerald-600",
  purple: "bg-violet-500/10 text-violet-600",
  orange: "bg-amber-500/10 text-amber-600",
  pink: "bg-pink-500/10 text-pink-600",
};

/** Franja de features/highlights (icono de color + título + descripción) en grid responsivo. */
export default function FeatureStrip({ items }: FeatureStripProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, description }, idx) => {
        const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
        return (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-xl", ACCENT_ICON[accent])}>
              <Icon size={22} />
            </div>
            <h3 className="font-display font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
        );
      })}
    </div>
  );
}
