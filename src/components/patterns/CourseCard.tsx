import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pickCardImage } from "./cardImages";

export type CardAccent = "blue" | "green" | "purple" | "orange" | "pink";

const ACCENT_BADGE: Record<CardAccent, string> = {
  blue: "bg-blue-600 text-white",
  green: "bg-emerald-600 text-white",
  purple: "bg-violet-600 text-white",
  orange: "bg-amber-500 text-white",
  pink: "bg-pink-600 text-white",
};

const ACCENT_ICON_BG: Record<CardAccent, string> = {
  blue: "bg-blue-600/90 text-white",
  green: "bg-emerald-600/90 text-white",
  purple: "bg-violet-600/90 text-white",
  orange: "bg-amber-500/90 text-white",
  pink: "bg-pink-600/90 text-white",
};

interface CourseCardProps {
  /** Ruta interna (react-router) o URL externa (http/https, se abre en pestaña nueva). Si se omite, la card no es clicable. */
  to?: string;
  title: string;
  description?: string;
  badge?: string;
  accent?: CardAccent;
  icon?: LucideIcon;
  /** Thumbnail real (Project/VideoCourse). Si no se pasa, se usa una foto stock determinística. */
  image?: string | null;
  meta?: React.ReactNode;
  className?: string;
}

/** Card estilo Edution para cursos/tutoriales/proyectos: foto + badge de categoría flotante + info. */
export default function CourseCard({
  to,
  title,
  description,
  badge,
  accent = "blue",
  icon: Icon,
  image,
  meta,
  className,
}: CourseCardProps) {
  const resolvedImage = image || pickCardImage(title || to || "card");
  const isExternal = !!to && /^https?:\/\//.test(to);
  const isInteractive = !!to;
  const wrapperClassName = cn("group block", isInteractive && "cursor-pointer", className);

  const cardBody = (
    <Card className="h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={resolvedImage}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
        {badge && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm",
              ACCENT_BADGE[accent]
            )}
          >
            {badge}
          </span>
        )}
        {Icon && (
          <span
            className={cn(
              "absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm",
              ACCENT_ICON_BG[accent]
            )}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="font-display font-semibold text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}
        {meta && (
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isExternal) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={wrapperClassName}>
        {cardBody}
      </a>
    );
  }

  if (isInteractive) {
    return (
      <Link to={to as string} className={wrapperClassName}>
        {cardBody}
      </Link>
    );
  }

  return <div className={wrapperClassName}>{cardBody}</div>;
}
