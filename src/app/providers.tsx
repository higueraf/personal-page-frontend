import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "./queryClient";
import { useAuth } from "../shared/auth/authStore";
import { ThemeProvider } from "../shared/theme/ThemeProvider";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuth((s) => s.bootstrap);
  const status = useAuth((s) => s.status);

  useEffect(() => {
    if (status === "idle") bootstrap();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
