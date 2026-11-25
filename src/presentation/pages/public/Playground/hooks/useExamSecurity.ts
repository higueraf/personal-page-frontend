import { useCallback, useEffect, useRef, useState } from "react";
import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import { usePlaygroundStore } from "../store/playgroundStore";

interface UseExamSecurityParams {
  id: string | undefined;
  isExam: boolean;
  isReadOnly: boolean;
  allowCopyPaste: boolean;
  isInSEB: boolean;
  examFinishedRef: React.MutableRefObject<boolean>;
  internalClipboardRef: React.MutableRefObject<string>;
}

export function useExamSecurity({
  id,
  isExam,
  isReadOnly,
  allowCopyPaste,
  isInSEB,
  examFinishedRef,
  internalClipboardRef,
}: UseExamSecurityParams) {
  const { setSecurityLocked, setReadOnly } = usePlaygroundStore();

  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isTabSwitchLocked, setIsTabSwitchLocked] = useState(false);
  const [isKeyboardAlertLocked, setIsKeyboardAlertLocked] = useState(false);

  // Set inside `beforeunload` (fires before `visibilitychange`/`blur` in the
  // unload sequence) so a refresh/close isn't misreported as a tab switch —
  // `visibilitychange` always fires with `hidden` right before a page unloads,
  // even on a plain refresh, not just on a genuine tab/window switch.
  const unloadingRef = useRef(false);

  // Called after every logCheat response: the backend groups incidents and
  // may have just crossed the 5-incident threshold — if so, lock the editor
  // immediately client-side too, without waiting for a page refresh.
  const handleCheatLogResult = useCallback((res: { security_locked: boolean }) => {
    if (res.security_locked) {
      setSecurityLocked(true);
      setReadOnly(true);
    }
  }, [setSecurityLocked, setReadOnly]);

  // ── Block browser back/forward during exam ──────────────────────────────────
  // Traps the student on this route: any attempt to navigate away via the
  // browser's back/forward buttons just re-pushes the same URL.
  useEffect(() => {
    if (!isExam || isReadOnly) return;
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      if (examFinishedRef.current) return;
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isExam, isReadOnly]);

  // ── Exam Restrictions ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isExam || isReadOnly) return;

    // 0. Best-effort clipboard clear at exam start — an extra layer so a
    //    student can't paste content copied from outside before the exam
    //    began (does NOT replace the external-paste block below, which is
    //    the actual protection during the exam).
    navigator.clipboard?.writeText("").catch(() => {});

    // 1. Enter Fullscreen (may require user interaction so it's a best-effort)
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    enterFullscreen();
    // Try again on any click inside the document to bypass browser auto-block
    document.addEventListener("click", enterFullscreen, { once: true });

    // 2. Prevent exiting/reloading (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Salida intencional por nuestros propios flujos ("Salir sin entregar", "Salir del
      // examen"): no hay nada que confirmar. Sin este corte, el diálogo nativo de
      // "¿seguro que deseas salir?" sigue disparándose incluso cuando YA se decidió salir
      // (confirmado con `window.confirm` en el botón), y dentro del WebView kiosco de Safe
      // Exam Browser ese diálogo nativo nunca se resuelve — la navegación a `/seb-quit`
      // jamás llega a completarse y el alumno queda atascado en la misma pantalla.
      if (examFinishedRef.current) return;
      unloadingRef.current = true;
      // Safety net: if the browser's "leave site?" prompt gets cancelled (the
      // student stays), the page never actually unloads, so nothing else would
      // ever clear this flag — reset it after a beat so real tab/window
      // switches keep being detected normally.
      setTimeout(() => { unloadingRef.current = false; }, 1000);
      const msg = "Estás en un examen activo. ¿Seguro que deseas salir?";
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 3. Block external paste — allow internal copy/paste within the editor
    //    Strategy: when user copies/cuts inside Monaco, we store the text in
    //    internalClipboardRef. On paste, we compare the clipboard text against
    //    internalClipboardRef; if it differs → it came from outside → block.
    const normalizeLF = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const handlePaste = (e: ClipboardEvent) => {
      if (allowCopyPaste) return;
      const pastedText = e.clipboardData?.getData("text") ?? "";
      if (pastedText && normalizeLF(pastedText) !== normalizeLF(internalClipboardRef.current)) {
        e.preventDefault();
        e.stopPropagation();
        playgroundUseCases.logCheat(
          id as string,
          "paste_external",
          "El alumno intentó pegar contenido externo al editor."
        ).then(handleCheatLogResult).catch(() => {});
        alert("Solo puedes pegar contenido que hayas copiado dentro del editor. Pegar texto externo está bloqueado durante este examen.");
      }
    };

    // Block cut/copy ONLY outside the editor (context menus, other elements)
    const handleCopyCutOutsideEditor = (e: ClipboardEvent) => {
      if (allowCopyPaste) return;
      const editorContainer = document.querySelector(".monaco-editor");
      if (editorContainer && editorContainer.contains(e.target as Node)) {
        // Copy/cut inside Monaco — track in our internal clipboard
        // The actual text gets tracked via Monaco's onDidChangeCursorSelection below
        return; // allow it
      }
      // Outside the editor — block
      e.preventDefault();
      e.stopPropagation();
    };

    // Block drag-and-drop of external text into the editor — without this,
    // dragging text from another app/window bypasses the paste block above
    // entirely, since `drop` never fires a `paste` ClipboardEvent.
    const handleDropOrDragOver = (e: DragEvent) => {
      if (allowCopyPaste) return;
      e.preventDefault();
      e.stopPropagation();
    };

    // 4. Fullscreen lock check
    // NO aplica dentro de Safe Exam Browser: SEB ya mantiene su propio modo kiosco a nivel de
    // sistema operativo (no se puede minimizar, alternar de ventana ni salir sin pasar por
    // quitURL), así que este chequeo es redundante ahí — y en la práctica `document.fullscreenElement`
    // se ha visto inconsistente dentro de SEB (se "sale" de fullscreen sola al interactuar con el
    // iframe de vista previa, más notorio en exámenes con mucha interacción de UI como react-crud),
    // generando bloqueos falsos que dejaban al alumno sin poder guardar ni entregar. Fuera de SEB
    // este sigue siendo el único mecanismo real contra salir de pantalla completa, así que ahí se
    // mantiene activo.
    const handleFullscreenChange = () => {
      if (isInSEB) return;
      if (!document.fullscreenElement) {
        if (examFinishedRef.current) return; // exiting fullscreen as part of submit — ignore
        setIsLockedOut(true);
        playgroundUseCases.logCheat(
          id as string,
          "exit_fullscreen",
          "El alumno salió del modo pantalla completa."
        ).then(handleCheatLogResult).catch(() => {});
      } else {
        setIsLockedOut(false);
      }
    };

    // 5. Tab/window switch monitoring — applies to ALL exams
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (examFinishedRef.current || unloadingRef.current) return;
        playgroundUseCases.logCheat(
          id as string,
          "tab_switch",
          "El alumno cambió de pestaña, abrió otra ventana o minimizó el navegador."
        ).then(handleCheatLogResult).catch(() => {});
        setIsTabSwitchLocked(true);
      }
    };

    // 6. Window blur — catches Alt+Tab to another app (visibilitychange may not fire in all browsers).
    //    EXCEPTION: clicking inside the built-in HTML preview iframe also fires window.blur because
    //    the iframe captures focus from the parent window. We must NOT flag that as a violation.
    //    Strategy: defer the check with setTimeout(0) so the browser has time to update
    //    document.activeElement. If the new active element is an <iframe> that lives inside this
    //    page (i.e. the preview panel), we silently ignore the blur.
    const handleWindowBlur = () => {
      if (examFinishedRef.current || unloadingRef.current) return;
      setTimeout(() => {
        if (examFinishedRef.current || unloadingRef.current) return;
        // If focus moved to an iframe that belongs to this document it is the
        // preview panel — not a real tab/window switch.
        const active = document.activeElement;
        if (active && active.tagName === 'IFRAME') return;

        playgroundUseCases.logCheat(
          id as string,
          "window_blur",
          "El alumno cambió de ventana o aplicación (Alt+Tab u otro método)."
        ).then(handleCheatLogResult).catch(() => {});
        setIsTabSwitchLocked(true);
      }, 0);
    };

    // Fullscreen + visibility + blur apply to all exams
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    if (!allowCopyPaste) {
      window.addEventListener("paste", handlePaste, true);
      window.addEventListener("copy", handleCopyCutOutsideEditor as any, true);
      window.addEventListener("cut", handleCopyCutOutsideEditor as any, true);
      window.addEventListener("drop", handleDropOrDragOver, true);
      window.addEventListener("dragover", handleDropOrDragOver, true);
    }

    return () => {
      document.removeEventListener("click", enterFullscreen);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      if (!allowCopyPaste) {
        window.removeEventListener("paste", handlePaste, true);
        window.removeEventListener("copy", handleCopyCutOutsideEditor as any, true);
        window.removeEventListener("cut", handleCopyCutOutsideEditor as any, true);
        window.removeEventListener("drop", handleDropOrDragOver, true);
        window.removeEventListener("dragover", handleDropOrDragOver, true);
      }
    };
  }, [isExam, isReadOnly, allowCopyPaste, isInSEB]);

  // ── Exam Keyboard Lock: block navigation shortcuts ───────────────────────────
  useEffect(() => {
    if (!isExam || isReadOnly) return;

    const handleDangerousKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isDangerous =
        (e.altKey && e.key === 'Tab') ||          // Alt+Tab  — cambiar ventana
        (e.altKey && e.key === 'F4') ||           // Alt+F4   — cerrar ventana
        (e.ctrlKey && key === 'w') ||             // Ctrl+W   — cerrar pestaña
        (e.ctrlKey && key === 't') ||             // Ctrl+T   — nueva pestaña
        (e.ctrlKey && key === 'n') ||             // Ctrl+N   — nueva ventana
        (e.ctrlKey && e.key === 'Tab') ||         // Ctrl+Tab — cambiar pestaña
        (e.ctrlKey && e.shiftKey && e.key === 'Tab') || // Ctrl+Shift+Tab
        (e.key === 'F5') ||                       // F5       — recargar
        (e.ctrlKey && key === 'r') ||             // Ctrl+R   — recargar
        (e.ctrlKey && key === 'l') ||             // Ctrl+L   — barra de dirección
        (e.metaKey);                              // Tecla Windows/Cmd

      if (isDangerous) {
        e.preventDefault();
        e.stopPropagation();
        setIsKeyboardAlertLocked(true);
        const combo = [
          e.ctrlKey && 'Ctrl',
          e.altKey && 'Alt',
          e.shiftKey && 'Shift',
          e.metaKey && 'Meta',
          e.key,
        ].filter(Boolean).join('+');
        playgroundUseCases.logCheat(
          id as string,
          'keyboard_escape_attempt',
          `El alumno intentó salir del examen con teclado: ${combo}`
        ).then(handleCheatLogResult).catch(() => {});
      }
    };

    window.addEventListener('keydown', handleDangerousKey, true);
    return () => window.removeEventListener('keydown', handleDangerousKey, true);
  }, [isExam, isReadOnly, id]);

  return {
    isLockedOut,
    setIsLockedOut,
    isTabSwitchLocked,
    setIsTabSwitchLocked,
    isKeyboardAlertLocked,
    setIsKeyboardAlertLocked,
  };
}
