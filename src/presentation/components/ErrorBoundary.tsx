import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary capturó un error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-auto bg-red-50 p-6 text-center dark:bg-red-950/30">
        <p className="font-semibold text-red-700 dark:text-red-400">
          Ocurrió un error al renderizar esta vista previa
        </p>
        <pre className="max-h-40 max-w-full overflow-auto whitespace-pre-wrap break-words text-xs text-red-600 dark:text-red-400">
          {error.message}
        </pre>
        <button
          onClick={this.reset}
          className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/40"
        >
          Reintentar
        </button>
      </div>
    );
  }
}
