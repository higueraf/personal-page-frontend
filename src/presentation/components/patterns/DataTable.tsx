import { Card } from "@/presentation/components/ui/card";
import { Table } from "@/presentation/components/ui/table";
import { cn } from "@/presentation/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper visual sobre @/presentation/components/ui/table: las páginas admin conservan su
 * .map()/lógica de TableHeader/TableBody y solo cambian el shell (borde + scroll).
 */
export default function DataTable({ children, className }: DataTableProps) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <Table>{children}</Table>
    </Card>
  );
}

export {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/presentation/components/ui/table";
