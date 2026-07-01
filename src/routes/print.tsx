import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slote, type SloteData } from "@/components/slote-preview";
import { productService } from "@/lib/products";
import { Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/print")({
  head: () => ({ meta: [{ title: "Impressão — Sistema de Slotes" }] }),
  component: PrintPage,
});

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function emptySlote(date: string): SloteData {
  return {
    responsibleName: "",
    code: "",
    description: "",
    quantity: "",
    validity: "",
    date,
  };
}

function PrintPage() {
  const today = useMemo(() => formatDate(new Date()), []);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [slotes, setSlotes] = useState<SloteData[]>(() => [emptySlote(today), emptySlote(today)]);
  const [notFound, setNotFound] = useState<boolean[]>([false, false]);

  const visible = orientation === "portrait" ? slotes.slice(0, 2) : slotes.slice(0, 1);

  function update(i: number, patch: Partial<SloteData>) {
    setSlotes((s) => s.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  const codeCache = useRef<Record<string, string | null>>({});
  async function lookup(i: number, code: string) {
    const v = code.trim();
    if (!v) {
      update(i, { description: "" });
      setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
      return;
    }
    try {
      let name = codeCache.current[v];
      if (name === undefined) {
        const p = await productService.getByCode(v);
        name = p ? p.name : null;
        codeCache.current[v] = name;
      }
      if (name) {
        update(i, { description: name });
        setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
      } else {
        update(i, { description: "" });
        setNotFound((n) => n.map((x, idx) => (idx === i ? true : x)));
      }
    } catch {
      update(i, { description: "" });
      setNotFound((n) => n.map((x, idx) => (idx === i ? true : x)));
    }
  }

  useEffect(() => {
    // reset today's date on each slote when day changes (kept simple)
    setSlotes((s) => s.map((v) => ({ ...v, date: today })));
  }, [today]);

  function handlePrint() {
    for (let i = 0; i < visible.length; i++) {
      const s = visible[i];
      const hasAny = s.responsibleName || s.code || s.quantity || s.description;
      if (!hasAny) continue; // allow blank second slote in portrait
      if (!s.responsibleName.trim()) return toast.error(`Slote ${i + 1}: informe seu nome.`);
      if (!s.code.trim()) return toast.error(`Slote ${i + 1}: informe o código.`);
      if (!s.quantity.trim()) return toast.error(`Slote ${i + 1}: informe a quantidade.`);
      if (notFound[i]) return toast.error(`Slote ${i + 1}: produto não encontrado.`);
    }
    if (!visible.some((s) => s.code.trim())) return toast.error("Preencha ao menos um slote.");
    window.print();
  }

  function clearSlote(i: number) {
    setSlotes((s) => s.map((v, idx) => (idx === i ? emptySlote(today) : v)));
    setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
  }

  return (
    <AppShell title="Impressão de Slotes">
      <div className={`space-y-4 print-root print-${orientation}`}>
        <Card className="no-print">
          <CardContent className="p-4 flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <Label>Modelo</Label>
              <RadioGroup
                value={orientation}
                onValueChange={(v) => setOrientation(v as "portrait" | "landscape")}
                className="flex gap-4 pt-1"
              >
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="portrait" id="o1" />
                  2 slotes / A4 vertical
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="landscape" id="o2" />
                  1 slote / A4 horizontal
                </label>
              </RadioGroup>
            </div>
            <div className="text-xs text-muted-foreground max-w-xs">
              Clique dentro dos campos do slote para editar. A descrição é preenchida automaticamente
              pelo código.
            </div>
            <div className="ml-auto flex gap-2">
              {visible.map((_, i) => (
                <Button key={i} type="button" variant="outline" size="sm" onClick={() => clearSlote(i)}>
                  Limpar slote {i + 1}
                </Button>
              ))}
              <Button type="button" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="preview-area">
          <div className="print-scale">
            <div className="print-sheet">
              {visible.map((s, i) => (
                <Slote
                  key={i}
                  data={s}
                  orientation={orientation}
                  editable
                  notFound={notFound[i]}
                  onChange={(patch) => update(i, patch)}
                  onCodeCommit={(code) => lookup(i, code)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
