import { AlertCircle, ShieldCheck, Lock } from "lucide-react";

interface SecurityLockedScreenProps {
  retryingUnlock: boolean;
  onRetryUnlock: () => void;
  exitingExam: boolean;
  onExitExam: () => void;
  onExitWithoutSubmit: () => void;
}

export function SecurityLockedScreen({
  retryingUnlock,
  onRetryUnlock,
  exitingExam,
  onExitExam,
  onExitWithoutSubmit,
}: SecurityLockedScreenProps) {
  return (
    <div className="fixed inset-0 bg-gray-950 z-[10000] flex flex-col items-center justify-center text-white p-8 text-center">
      <div className="w-24 h-24 mb-6 rounded-2xl bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center">
        <Lock size={48} className="text-red-400" />
      </div>
      <h2 className="text-3xl font-black tracking-tight mb-3 text-white">Editor Bloqueado</h2>
      <p className="text-base max-w-lg text-slate-300 mb-2">
        Tu editor fue bloqueado por múltiples incidentes de seguridad detectados durante este examen.
      </p>
      <p className="text-sm text-slate-400 max-w-lg mb-6">
        Contacta a tu profesor para que revise tu caso y reactive el examen. Si ya te autorizó, presiona
        "Reintentar". Si no puedes seguir esperando, puedes entregarlo tal como está o salir sin entregar.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onRetryUnlock}
          disabled={retryingUnlock}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
        >
          {retryingUnlock ? "Verificando…" : "Reintentar"}
        </button>
        <button
          onClick={onExitExam}
          disabled={exitingExam}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded-lg text-sm font-semibold transition-colors"
        >
          {exitingExam ? "Saliendo…" : "Entregar y salir"}
        </button>
        <button
          onClick={onExitWithoutSubmit}
          disabled={exitingExam}
          className="px-5 py-2.5 bg-transparent hover:bg-white/10 disabled:opacity-50 border border-gray-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
        >
          {exitingExam ? "Saliendo…" : "Salir sin entregar"}
        </button>
      </div>
    </div>
  );
}

interface SebRequiredScreenProps {
  exitingExam: boolean;
  onExitWithoutSubmit: () => void;
}

export function SebRequiredScreen({ exitingExam, onExitWithoutSubmit }: SebRequiredScreenProps) {
  return (
    <div className="fixed inset-0 bg-gray-950 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center">
      <div className="w-24 h-24 mb-6 rounded-2xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
        <ShieldCheck size={48} className="text-blue-400" />
      </div>
      <h2 className="text-3xl font-black tracking-tight mb-3 text-white">Safe Exam Browser Requerido</h2>
      <p className="text-base max-w-lg text-slate-300 mb-2">
        Este examen requiere <strong className="text-white">Safe Exam Browser (SEB)</strong> para poder acceder.
        No puedes abrirlo desde un navegador normal.
      </p>
      <p className="text-sm text-slate-400 mb-8 max-w-lg">
        Descarga el archivo de configuración <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.seb</code> proporcionado
        por tu profesor, ábrelo y se lanzará automáticamente en modo seguro.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="https://safeexambrowser.org/download_en.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg"
        >
          Descargar Safe Exam Browser
        </a>
        <button
          onClick={onExitWithoutSubmit}
          disabled={exitingExam}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {exitingExam ? "Saliendo…" : "Salir sin entregar"}
        </button>
      </div>
    </div>
  );
}

export function FullscreenLockScreen() {
  return (
    <div className="fixed inset-0 bg-red-900/95 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-sm">
      <AlertCircle size={80} className="mb-6 animate-pulse text-red-400" />
      <h2 className="text-4xl font-black tracking-tight mb-4 text-white">EXAMEN INTERRUMPIDO</h2>
      <p className="text-lg max-w-xl text-red-200 mb-8">
        Has minimizado la ventana o salido del modo de pantalla completa. Esta acción está directamente prohibida y el incidente ha sido notificado y añadido al historial de fraude.
      </p>
      <button
        onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
        className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded-lg shadow-2xl hover:bg-gray-200 hover:scale-105 transition-all"
      >
        VOLVER A PANTALLA COMPLETA
      </button>
    </div>
  );
}

export function TabSwitchLockScreen({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-red-900/95 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-sm">
      <AlertCircle size={80} className="mb-6 animate-pulse text-red-400" />
      <h2 className="text-4xl font-black tracking-tight mb-4 text-white">CAMBIO DE PESTAÑA DETECTADO</h2>
      <p className="text-lg max-w-xl text-red-200 mb-8">
        Has cambiado de pestaña o ventana durante el examen. Esta acción está directamente prohibida y el incidente ha sido notificado y añadido al historial de fraude.
      </p>
      <button
        onClick={onDismiss}
        className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded-lg shadow-2xl hover:bg-gray-200 hover:scale-105 transition-all"
      >
        VOLVER AL EXAMEN
      </button>
    </div>
  );
}

export function KeyboardLockScreen({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-red-900/95 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-sm">
      <AlertCircle size={80} className="mb-6 animate-pulse text-red-400" />
      <h2 className="text-4xl font-black tracking-tight mb-4 text-white">COMBINACIÓN DE TECLAS BLOQUEADA</h2>
      <p className="text-lg max-w-xl text-red-200 mb-8">
        Has intentado usar una combinación de teclas para salir del examen. Esta acción está prohibida y el incidente ha sido notificado y añadido al historial de fraude.
      </p>
      <button
        onClick={onDismiss}
        className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded-lg shadow-2xl hover:bg-gray-200 hover:scale-105 transition-all"
      >
        VOLVER AL EXAMEN
      </button>
    </div>
  );
}
