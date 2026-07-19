import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/presentation/lib/utils";

export interface HighlightPanelItem {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  to?: string;
  ctaLabel?: string;
}

interface HighlightPanelsProps {
  items: HighlightPanelItem[];
}

/** Fila de 3 paneles estilo Academy: fondo alternado (claro / primary sólido / claro), foto circular flotante y CTA opcional en el panel central. */
export default function HighlightPanels({ items }: HighlightPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map(({ icon: Icon, title, description, image, to, ctaLabel }, idx) => {
        const filled = idx % 2 === 1;
        return (
          <div
            key={title}
            className={cn(
              "relative overflow-hidden rounded-2xl p-6 pt-8 transition-all hover:-translate-y-1",
              filled ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted/60 hover:shadow-md"
            )}
          >
            <img
              src={image}
              alt=""
              loading="lazy"
              className={cn(
                "absolute -top-3 right-5 h-24 w-24 rounded-full border-4 object-cover shadow-md",
                filled ? "border-primary-foreground/20" : "border-background"
              )}
            />
            <div
              className={cn(
                "mb-4 flex h-11 w-11 items-center justify-center rounded-xl",
                filled ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary"
              )}
            >
              <Icon size={22} />
            </div>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className={cn("mt-2 text-sm leading-relaxed", filled ? "text-primary-foreground/85" : "text-muted-foreground")}>
              {description}
            </p>
            {to && (
              <Link
                to={to}
                className={cn(
                  "mt-4 inline-flex items-center gap-2 text-sm font-semibold",
                  filled ? "text-primary-foreground" : "text-primary"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border",
                    filled ? "border-primary-foreground/40" : "border-primary/30"
                  )}
                >
                  <ArrowRight size={14} />
                </span>
                {ctaLabel ?? "Ver más"}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
