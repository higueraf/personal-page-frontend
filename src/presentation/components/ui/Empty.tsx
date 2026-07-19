export default function Empty({ message = "Sin resultados" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-foreground opacity-50">
      {message}
    </div>
  );
}
