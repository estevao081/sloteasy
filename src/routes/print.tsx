import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slote, type SloteData } from "@/components/slote-preview";
import { productService } from "@/lib/products";
import { Eye, Printer } from "lucide-react";
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

function PrintPage() {
  const today = useMemo(() => formatDate(new Date()), []);
  const [responsibleName, setResponsibleName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [validity, setValidity] = useState("");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [notFound, setNotFound] = useState(false);

  async function lookup(c: string) {
    const v = c.trim();
    if (!v) {
      setDescription("");
      setNotFound(false);
      return;
    }
    try {
      const p = await productService.getByCode(v);
      if (p) {
        setDescription(p.name);
        setNotFound(false);
      } else {
        setDescription("");
        setNotFound(true);
      }
    } catch {
      setDescription("");
      setNotFound(true);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => lookup(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  const validityFmt = validity
    ? (() => {
        const [y, m, d] = validity.split("-");
        return `${d}/${m}/${y}`;
      })()
    : "";

  const data: SloteData = {
    responsibleName,
    code,
    description,
    quantity,
    validity: validityFmt,
    date: today,
  };

  function handlePrint() {
    if (!responsibleName.trim()) return toast.error("Informe seu nome.");
    if (!code.trim()) return toast.error("Informe o código do produto.");
    if (!quantity.trim()) return toast.error("Informe a quantidade.");
    if (notFound) return toast.error("Produto não encontrado.");
    window.print();
  }

  return (
    <AppShell title="Impressão de Slotes">
      <div className={`space-y-6 print-root print-${orientation}`}>
        <Card className="no-print">
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome *</Label>
                <Input
                  id="name"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Responsável pela criação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código do Produto *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: 117170"
                />
                {notFound && <p className="text-xs text-destructive">Produto não encontrado</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" value={description} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantidade *</Label>
                <Input
                  id="qty"
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="val">Validade (opcional)</Label>
                <Input
                  id="val"
                  type="date"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-mono">
                  {today}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <RadioGroup
                  value={orientation}
                  onValueChange={(v) => setOrientation(v as "portrait" | "landscape")}
                  className="flex flex-col gap-1 pt-1"
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
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
                }
              >
                <Eye className="h-4 w-4 mr-2" /> Visualizar
              </Button>
              <Button type="button" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="preview-area">
          <h2 className="no-print text-sm font-medium text-muted-foreground mb-3">
            Pré-visualização
          </h2>
          <div className="print-scale">
            <div className="print-sheet">
              <Slote data={data} orientation={orientation} />
              {orientation === "portrait" && <Slote data={data} orientation={orientation} />}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
