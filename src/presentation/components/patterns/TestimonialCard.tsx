import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar";
import { Card, CardContent } from "@/presentation/components/ui/card";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
  avatarSrc?: string;
}

export default function TestimonialCard({ quote, name, role, avatarSrc }: TestimonialCardProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <Card className="h-full p-6">
      <CardContent className="p-0">
        <Quote className="mb-3 text-brand-accent" size={24} />
        <p className="text-sm leading-relaxed text-foreground/90">{quote}</p>
        <div className="mt-5 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold text-foreground">{name}</div>
            {role && <div className="text-xs text-muted-foreground">{role}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
