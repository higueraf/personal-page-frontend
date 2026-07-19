import { useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { VirtualFile } from '../store/playgroundStore';

// Derive the WebSocket base URL from the API URL by stripping the /api suffix
const API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api';
const SOCKET_BASE = API_URL.replace(/\/api\/?$/, '');

export interface ExecutionSocketOptions {
  /** Called with raw bytes/ANSI string from the process stdout/stderr */
  onOutput: (data: string) => void;
  /** Called when the process exits or is killed */
  onDone: (code: number, killed?: boolean) => void;
  /** Called when the socket fails to connect */
  onConnectionError?: (message: string) => void;
}

export function useExecutionSocket(options: ExecutionSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  // Stable refs so the socket callbacks don't close over stale values
  const onOutputRef = useRef(options.onOutput);
  const onDoneRef = useRef(options.onDone);
  const onConnectionErrorRef = useRef(options.onConnectionError);

  useEffect(() => { onOutputRef.current = options.onOutput; }, [options.onOutput]);
  useEffect(() => { onDoneRef.current = options.onDone; }, [options.onDone]);
  useEffect(() => { onConnectionErrorRef.current = options.onConnectionError; }, [options.onConnectionError]);

  // Disconnect and clean up socket on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  /** Lazily connects the socket if not already connected, then returns it */
  const ensureConnected = useCallback((): Socket => {
    if (socketRef.current?.connected) return socketRef.current;

    // Disconnect a stale socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(`${SOCKET_BASE}/execution`, {
      withCredentials: true,   // sends the httpOnly "jwt" cookie
      transports: ['websocket'],
      reconnection: false,
    });

    socket.on('terminal_output', (data: string) => {
      onOutputRef.current(data);
    });

    socket.on('execution_done', ({ code, killed }: { code: number; killed?: boolean }) => {
      onDoneRef.current(code, killed);
    });

    socket.on('connect_error', (err: Error) => {
      onConnectionErrorRef.current?.(err.message);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  /** Spawn a new execution on the backend via WebSocket */
  const startExecution = useCallback(
    (language: string, files: VirtualFile[], targetFile?: string) => {
      const socket = ensureConnected();
      const codeFiles = files
        .filter((f) => !f.is_folder && f.content.trim() !== '')
        .map((f) => ({ name: f.name, content: f.content }));

      socket.emit('start_execution', { language, files: codeFiles, targetFile });
    },
    [ensureConnected],
  );

  /** Send a raw keystroke / data chunk to the running process stdin */
  const sendInput = useCallback((data: string) => {
    socketRef.current?.emit('terminal_input', data);
  }, []);

  /** Signal the running process to stop */
  const stopExecution = useCallback(() => {
    socketRef.current?.emit('stop_execution');
  }, []);

  return { startExecution, sendInput, stopExecution };
}
