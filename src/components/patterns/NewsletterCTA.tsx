import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterCTAProps {
  title: string;
  description?: string;
  actionLabel: string;
  onAction?: () => void;
  to?: string;
  image?: string;
  className?: string;
}

/** Banda CTA azul de ancho completo, estilo Edution ("¿Quieres aprender este stack?"). */
export default function NewsletterCTA({ title, description, actionLabel, onAction, to, image, className }: NewsletterCTAProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12", className)}>
      {image && (
        <img
          src={image}
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-80 object-cover opacity-20 mix-blend-luminosity md:block"
        />
      )}
      <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-2xl font-bold sm:text-3xl">{title}</h3>
          {description && <p className="mt-2 max-w-lg text-primary-foreground/80">{description}</p>}
        </div>
        <Button
          size="lg"
          onClick={onAction}
          asChild={!!to}
          className="shrink-0 bg-brand-accent text-[#1E1300] hover:bg-brand-accentHover"
        >
          {to ? (
            <a href={to}>
              {actionLabel}
              <ArrowRight size={16} />
            </a>
          ) : (
            <span>
              {actionLabel}
              <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
