import CodeBlock from "./CodeBlock";
import TableBlock from "./TableBlock";

export default function BlockRenderer({ blocks }: { blocks: Array<any> }) {
  return (
    <div className="space-y-6">
      {blocks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((b) => {
          switch (b.type) {
            case "heading": {
              const level = b.data?.level ?? 2;
              const text = b.data?.text ?? "";
              const Tag = `h${Math.min(3, Math.max(1, level))}` as any;
              return <Tag key={b.id} className="font-semibold text-xl text-foreground">{text}</Tag>;
            }
            case "paragraph":
              return <p key={b.id} className="leading-relaxed text-foreground">{b.data?.text}</p>;

            case "list": {
              const style = b.data?.style ?? "ul";
              const items: string[] = b.data?.items ?? [];
              if (style === "ol") {
                return (
                  <ol key={b.id} className="list-decimal pl-6 space-y-1 text-foreground">
                    {items.map((it, idx) => <li key={idx}>{it}</li>)}
                  </ol>
                );
              }
              return (
                <ul key={b.id} className="list-disc pl-6 space-y-1 text-foreground">
                  {items.map((it, idx) => <li key={idx}>{it}</li>)}
                </ul>
              );
            }

            case "code":
              return (
                <CodeBlock
                  key={b.id}
                  language={b.data?.language ?? "plaintext"}
                  code={b.data?.code ?? ""}
                  filename={b.data?.filename}
                />
              );

            case "table":
              return (
                <TableBlock
                  key={b.id}
                  headers={b.data?.headers ?? []}
                  rows={b.data?.rows ?? []}
                />
              );

            case "callout": {
              const variant = b.data?.variant ?? "note";
              const text = b.data?.text ?? "";
              return (
                <div key={b.id} className="rounded-lg border bg-muted p-4">
                  <div className="font-semibold mb-1 text-foreground">{variant.toUpperCase()}</div>
                  <div className="text-foreground">{text}</div>
                </div>
              );
            }

            case "divider":
              return <hr key={b.id} className="opacity-40" />;

            default:
              return null;
          }
        })}
    </div>
  );
}
