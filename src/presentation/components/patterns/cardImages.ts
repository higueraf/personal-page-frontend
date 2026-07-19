/**
 * Banco de fotos stock (descargadas localmente, ver public/images/cards/) usado como
 * thumbnail de respaldo en CourseCard cuando la entidad (Course/Tutorial) no tiene
 * imagen propia en el backend. Project/VideoCourse usan su `thumbnail` real si existe.
 */
const CARD_IMAGES = [
  "/images/cards/web-code.jpg",
  "/images/cards/mobile-dev.jpg",
  "/images/cards/database-schema.jpg",
  "/images/cards/terminal-closeup.jpg",
  "/images/cards/devops-cloud.jpg",
  "/images/cards/ui-design.jpg",
  "/images/cards/book-learning.jpg",
  "/images/cards/whiteboard-planning.jpg",
];

/** Elige una imagen de forma determinística según un seed (ej. id o slug) para que cada card sea siempre la misma. */
export function pickCardImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CARD_IMAGES[hash % CARD_IMAGES.length];
}
