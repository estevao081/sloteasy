import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slote, type SloteData } from "@/components/slote-preview";
import { productService, type Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
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

function emptySlote(date: string, responsibleName = ""): SloteData {
  return {
    responsibleName,
    code: "",
    description: "",
    quantity: "",
    validity: "",
    date,
  };
}

type SloteFieldErrors = {
  responsibleName?: boolean;
  code?: boolean;
  quantity?: boolean;
};

function PrintPage() {
  const today = useMemo(() => formatDate(new Date()), []);
  const responsibleName = useMemo(() => getCurrentUser()?.name?.trim() || "", []);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [slotes, setSlotes] = useState<SloteData[]>(() => [
    emptySlote(today, responsibleName),
    emptySlote(today, responsibleName),
  ]);
  const [notFound, setNotFound] = useState<boolean[]>([false, false]);
  const [fieldErrors, setFieldErrors] = useState<SloteFieldErrors[]>([{}, {}]);

  const visible = orientation === "portrait" ? slotes.slice(0, 2) : slotes.slice(0, 1);

  function update(i: number, patch: Partial<SloteData>) {
    setSlotes((s) => {
      const updated = s.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
      
      // Se estamos no modo portrait (2 slotes verticais) e o campo responsibleName foi alterado no slote 0
      // então duplicar para o slote 1
      if (orientation === "portrait" && i === 0 && patch.responsibleName !== undefined) {
        updated[1] = { ...updated[1], responsibleName: patch.responsibleName };
      }
      
      return updated;
    });
    // Assim que o usuário edita o slote, removemos o destaque de erro dele —
    // a próxima tentativa de impressão revalida o que ainda estiver faltando.
    setFieldErrors((errs) => errs.map((e, idx) => (idx === i ? {} : e)));
  }

  // A API expõe dois endpoints (/products/code/{code} e /products/name/{name}).
  // O campo de busca é único: se o usuário digitar exatamente 6 números,
  // buscamos por código; qualquer outra coisa, buscamos por nome.
  const CODE_PATTERN = /^\d{6}$/;
  const searchCache = useRef<Record<string, Product | null>>({});
  async function lookup(i: number, value: string) {
    const v = value.trim();
    if (!v) {
      update(i, { description: "" });
      setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
      return;
    }
    const byCode = CODE_PATTERN.test(v);
    const cacheKey = `${byCode ? "code" : "name"}:${v.toLowerCase()}`;
    try {
      let product = searchCache.current[cacheKey];
      if (product === undefined) {
        product = byCode ? await productService.getByCode(v) : await productService.getByName(v);
        searchCache.current[cacheKey] = product;
      }
      if (product) {
        // Quando a busca é por nome, substituímos o texto digitado pelo
        // código real do produto retornado pela API.
        update(i, { description: product.name, ...(byCode ? {} : { code: product.code }) });
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

  useEffect(() => {
    // Alterna dinamicamente o tamanho físico da página (@page) conforme a
    // orientação escolhida. Evitamos o recurso de "named pages" do CSS
    // (page: nome-da-pagina), que tem suporte instável nos navegadores e
    // costumava gerar uma folha extra em branco ao trocar de tamanho de
    // página no modo paisagem.
    const styleId = "print-page-size";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: A4 ${orientation}; margin: 0; } }`;
    return () => {
      styleEl?.remove();
    };
  }, [orientation]);

  function handlePrint() {
    window.print();
  }

  function clearSlote(i: number) {
    setSlotes((s) => s.map((v, idx) => (idx === i ? emptySlote(today, responsibleName) : v)));
    setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
    setFieldErrors((errs) => errs.map((e, idx) => (idx === i ? {} : e)));
  }

  return (
    <AppShell title="Impressão de Slotes">
      <div className={`space-y-4 print:space-y-0 print-root print-${orientation}`}>
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
              Clique dentro dos campos do slote para editar. Digite o código (6 números) ou o nome
              do produto — a descrição e o código são preenchidos automaticamente pela busca.
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
                  lockResponsibleName
                  notFound={notFound[i]}
                  errors={fieldErrors[i]}
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
