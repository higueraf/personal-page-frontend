export default function EmptyEditor({ language, config }: { language: string; config: any }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 dark:text-slate-600">
      <div className="text-center">
        <div className="text-5xl mb-3">{config.emoji}</div>
        <p className="text-sm mb-1">Selecciona un archivo para empezar</p>
        <p className="text-xs text-gray-500 dark:text-slate-700">{language} playground</p>
      </div>
    </div>
  );
}
