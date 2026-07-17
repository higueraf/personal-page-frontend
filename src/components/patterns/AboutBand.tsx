import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AboutBandBadge {
  icon: LucideIcon;
  label: string;
}

export interface AboutBandStat {
  value: string;
  label: string;
}

interface AboutBandProps {
  eyebrow: string;
  title: string;
  description: string;
  images: [string, string];
  badges: [AboutBandBadge, AboutBandBadge];
  stats: AboutBandStat[];
  actions?: React.ReactNode;
  className?: string;
}

/** Sección "Sobre mí" estilo Academy: 2 fotos superpuestas con badges flotantes + columna de texto con stats reales. */
export default function AboutBand({ eyebrow, title, description, images, badges, stats, actions, className }: AboutBandProps) {
  const [imgTop, imgBottom] = images;
  const [badgeTop, badgeBottom] = badges;

  return (
    <div className={cn("grid grid-cols-1 items-center gap-12 md:grid-cols-2", className)}>
      <div className="relative mx-auto h-[380px] w-full max-w-md">
        <div className="absolute left-0 top-0 h-56 w-72 overflow-hidden rounded-2xl shadow-lg">
          <img src={imgTop} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="absolute -top-3 left-2 flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-semibold shadow-md">
          <badgeTop.icon size={14} className="text-primary" />
          {badgeTop.label}
        </div>

        <div className="absolute bottom-0 right-0 h-56 w-72 overflow-hidden rounded-2xl shadow-lg">
          <img src={imgBottom} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="absolute bottom-3 right-2 flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-semibold shadow-md">
          <badgeBottom.icon size={14} className="text-primary" />
          {badgeBottom.label}
        </div>
      </div>

      <div>
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
        <p className="mt-4 text-muted-foreground">{description}</p>

        {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}

        <div className="mt-8 flex flex-wrap gap-8 border-t border-border pt-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
