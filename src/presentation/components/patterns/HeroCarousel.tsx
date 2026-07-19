import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/presentation/components/ui/carousel";

interface Slide {
  image: string;
  quote: string;
  author: string;
}

const SLIDES: Slide[] = [
  {
    image: "/images/carousel/code-screen.jpg",
    quote: "El código que escribes hoy es la base del software que impacta mañana.",
    author: "Sigue construyendo",
  },
  {
    image: "/images/carousel/laptop-coding.jpg",
    quote: "Cada bug resuelto es una lección que te acerca a ser mejor developer.",
    author: "Aprende resolviendo",
  },
  {
    image: "/images/carousel/workspace-coding.jpg",
    quote: "La constancia diaria frente al teclado es lo que separa una idea de un producto.",
    author: "Practica todos los días",
  },
  {
    image: "/images/carousel/macbook-code.jpg",
    quote: "No necesitas saberlo todo, solo necesitas empezar a escribir la primera línea.",
    author: "Da el primer paso",
  },
  {
    image: "/images/carousel/matrix-code.jpg",
    quote: "Detrás de cada gran aplicación hay cientos de horas de práctica silenciosa.",
    author: "Confía en el proceso",
  },
  {
    image: "/images/carousel/team-collab.jpg",
    quote: "Programar en equipo multiplica el aprendizaje: comparte lo que sabes.",
    author: "Crece en comunidad",
  },
];

interface HeroCarouselProps {
  /** Si es true el carousel ocupa el 100% del viewport (sin restricción de ancho) */
  fullWidth?: boolean;
}

/** Carousel del hero de Home: fotos de desarrollo de software + frases motivacionales. */
export default function HeroCarousel({ fullWidth = false }: HeroCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 4500, stopOnInteraction: false }));

  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[plugin.current]}
      className="w-full"
    >
      <CarouselContent>
        {SLIDES.map((slide) => (
          <CarouselItem key={slide.image}>
            <div
              className={
                fullWidth
                  ? "relative w-full overflow-hidden"
                  : "relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg sm:aspect-[16/10]"
              }
              style={fullWidth ? { height: "540px" } : undefined}
            >
              <img
                src={slide.image}
                alt={slide.author}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 max-w-3xl mx-auto text-center">
                <p className="font-display text-lg font-semibold leading-snug text-white sm:text-2xl">
                  "{slide.quote}"
                </p>
                <p className="mt-3 font-mono text-xs uppercase tracking-widest text-brand-accent">
                  — {slide.author}
                </p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        className={fullWidth ? "left-4 border-none bg-white/90 text-foreground hover:bg-white shadow-md" : "left-2 border-none bg-white/90 text-foreground hover:bg-white"}
      />
      <CarouselNext
        className={fullWidth ? "right-4 border-none bg-white/90 text-foreground hover:bg-white shadow-md" : "right-2 border-none bg-white/90 text-foreground hover:bg-white"}
      />
    </Carousel>
  );
}
