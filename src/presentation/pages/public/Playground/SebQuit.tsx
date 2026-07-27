import { ShieldCheck } from "lucide-react";

/**
 * Target page for the Safe Exam Browser `quitURL`. When SEB detects browser
 * navigation to this URL it intercepts it and closes the application itself
 * (see `quitURL`/`allowQuit=false` in the generated .seb config, backend
 * `playground.controller.ts` `downloadSebConfig`). This page only renders as
 * a fallback for the split second before SEB intercepts, or when opened
 * outside of SEB (e.g. testing in a normal browser).
 */
export default function SebQuit() {
  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center text-white p-8 text-center">
      <div className="w-24 h-24 mb-6 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
        <ShieldCheck size={48} className="text-blue-400" />
      </div>
      <h2 className="text-3xl font-black tracking-tight mb-3 text-white">Examen finalizado</h2>
      <p className="text-base max-w-lg text-slate-300">
        Cerrando Safe Exam Browser…
      </p>
      <p className="text-sm text-slate-400 mt-4 max-w-lg">
        Si esta ventana no se cierra automáticamente, ya puedes cerrar Safe Exam Browser de forma manual.
      </p>
    </div>
  );
}
