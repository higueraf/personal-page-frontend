import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FormCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** Wrapper Card centrado para Login/Register/Forgot/Reset/AdminProfile/UserSettings. */
export default function FormCard({ title, description, icon, children, footer, className }: FormCardProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="items-center text-center">
          {icon && (
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <CardTitle className="font-display text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        {footer && <div className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </Card>
    </div>
  );
}
