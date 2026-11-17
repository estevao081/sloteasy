import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slote, type SloteData } from "@/components/slote-preview";
import { PreCountSheet, type PreCountRow } from "@/components/pre-count-preview";
import { productService, type Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { clearPrintDraft, loadPrintDraft, savePrintDraft } from "@/lib/print-draft";
import { Plus, Printer, Trash2 } from "lucide-react";
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Uma folha só é considerada "preenchida" (e, portanto, enviada para a
// impressora) se pelo menos um dos slotes que ela contém tiver algum
// campo digitado pelo usuário. Usamos "?? \"\"" como blindagem: se por
// algum motivo um campo vier undefined/null (ex.: resposta inesperada da
// API), isso nunca deve derrubar a tela com um erro de runtime.
function isSloteFilled(s: SloteData) {
  return (
    (s.code ?? "").trim() !== "" ||
    (s.quantity ?? "").trim() !== "" ||
    (s.validity ?? "").trim() !== ""
  );
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

  // O modelo vertical guarda folhas de 2 slotes cada e pode crescer
  // (botão "Adicionar folha"). O modelo horizontal tem sempre exatamente
  // 1 folha com 1 slote — por isso fica num estado totalmente separado,
  // e trocar de orientação não descarta o que já foi digitado em nenhum
  // dos dois.
  const [portraitSlotes, setPortraitSlotes] = useState<SloteData[]>(() => [
    emptySlote(today, responsibleName),
    emptySlote(today, responsibleName),
  ]);
  const [portraitNotFound, setPortraitNotFound] = useState<boolean[]>([false, false]);
  const [portraitErrors, setPortraitErrors] = useState<SloteFieldErrors[]>([{}, {}]);

  const [landscapeSlotes, setLandscapeSlotes] = useState<SloteData[]>(() => [
    emptySlote(today, responsibleName),
  ]);
  const [landscapeNotFound, setLandscapeNotFound] = useState<boolean[]>([false]);
  const [landscapeErrors, setLandscapeErrors] = useState<SloteFieldErrors[]>([{}]);

  // Opção (independente por orientação) de imprimir a folha de
  // pré-contagem junto com os slotes.
  const [printPreCountPortrait, setPrintPreCountPortrait] = useState(false);
  const [printPreCountLandscape, setPrintPreCountLandscape] = useState(false);

  const isPortrait = orientation === "portrait";
  const slotesPerPage = isPortrait ? 2 : 1;
  const slotes = isPortrait ? portraitSlotes : landscapeSlotes;
  const setSlotes = isPortrait ? setPortraitSlotes : setLandscapeSlotes;
  const notFound = isPortrait ? portraitNotFound : landscapeNotFound;
  const setNotFound = isPortrait ? setPortraitNotFound : setLandscapeNotFound;
  const fieldErrors = isPortrait ? portraitErrors : landscapeErrors;
  const setFieldErrors = isPortrait ? setPortraitErrors : setLandscapeErrors;
  const printPreCount = isPortrait ? printPreCountPortrait : printPreCountLandscape;
  const setPrintPreCount = isPortrait ? setPrintPreCountPortrait : setPrintPreCountLandscape;

  function update(i: number, patch: Partial<SloteData>) {
    setSlotes((s) => s.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
    // Assim que o usuário edita o slote, removemos o destaque de erro dele —
    // a próxima tentativa de impressão revalida o que ainda estiver faltando.
    setFieldErrors((errs) => errs.map((e, idx) => (idx === i ? {} : e)));
  }

  // O preenchimento é feito apenas pelo código do produto (busca por nome
  // foi removida a pedido).
  const searchCache = useRef<Record<string, Product | null>>({});

  // A API pode, em tese, devolver formatos inesperados (ex.: uma lista em
  // vez de um produto único). Validamos o formato antes de confiar na
  // resposta — sem isso, um retorno inesperado corrompe o slote com
  // código/descrição undefined e quebra a tela mais adiante.
  function normalizeProduct(raw: unknown): Product | null {
    if (!raw) return null;
    if (Array.isArray(raw)) {
      return raw.length > 0 ? normalizeProduct(raw[0]) : null;
    }
    if (typeof raw === "object") {
      const r = raw as Partial<Product>;
      if (typeof r.code === "string" && typeof r.name === "string") {
        return { ...r, code: r.code, name: r.name };
      }
    }
    return null;
  }

  async function lookup(i: number, value: string) {
    const v = value.trim();
    if (!v) {
      update(i, { description: "" });
      setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
      return;
    }
    const cacheKey = v.toLowerCase();
    try {
      let product = searchCache.current[cacheKey];
      if (product === undefined) {
        const raw = await productService.getByCode(v);
        product = normalizeProduct(raw);
        searchCache.current[cacheKey] = product;
      }
      if (product) {
        update(i, { description: product.name });
        setNotFound((n) => n.map((x, idx) => (idx === i ? false : x)));
      } else {
        update(i, { description: "" });
        setNotFound((n) => n.map((x, idx) => (idx === i ? true : x)));
        toast.error(`Produto não encontrado para o código "${v}"`, {
          description: "Confira o código digitado e tente novamente.",
        });
      }
    } catch {
      update(i, { description: "" });
      setNotFound((n) => n.map((x, idx) => (idx === i ? true : x)));
      toast.error(`Produto não encontrado para o código "${v}"`, {
        description: "Confira o código digitado e tente novamente.",
      });
    }
  }

  useEffect(() => {
    // reset today's date on each slote when day changes (kept simple)
    setPortraitSlotes((s) => s.map((v) => ({ ...v, date: today })));
    setLandscapeSlotes((s) => s.map((v) => ({ ...v, date: today })));
  }, [today]);

  // ---- Rascunho em cache (localStorage) ---------------------------------
  // Tudo que o usuário digita fica salvo até a impressão, e sobrevive a
  // troca de aba, reload e expiração de sessão. A leitura acontece só no
  // cliente, depois da montagem (evita divergência de hidratação no SSR), e
  // "draftLoaded" impede que o estado vazio inicial sobrescreva o rascunho
  // antes de ele ser lido.
  const [draftLoaded, setDraftLoaded] = useState(false);
  const printInProgress = useRef(false);

  useEffect(() => {
    const draft = loadPrintDraft(today, responsibleName);
    if (draft) {
      setOrientation(draft.orientation);
      setPortraitSlotes(draft.portraitSlotes);
      setPortraitNotFound(draft.portraitNotFound);
      setPortraitErrors(draft.portraitSlotes.map(() => ({})));
      setLandscapeSlotes(draft.landscapeSlotes);
      setLandscapeNotFound(draft.landscapeNotFound);
      setLandscapeErrors(draft.landscapeSlotes.map(() => ({})));
      setPrintPreCountPortrait(draft.printPreCountPortrait);
      setPrintPreCountLandscape(draft.printPreCountLandscape);
    }
    setDraftLoaded(true);
  }, [today, responsibleName]);

  useEffect(() => {
    if (!draftLoaded) return;
    const hasContent = [...portraitSlotes, ...landscapeSlotes].some(isSloteFilled);
    if (!hasContent) {
      // Nada digitado: não há o que guardar.
      clearPrintDraft();
      return;
    }
    savePrintDraft({
      orientation,
      portraitSlotes,
      portraitNotFound,
      landscapeSlotes,
      landscapeNotFound,
      printPreCountPortrait,
      printPreCountLandscape,
    });
  }, [
    draftLoaded,
    orientation,
    portraitSlotes,
    portraitNotFound,
    landscapeSlotes,
    landscapeNotFound,
    printPreCountPortrait,
    printPreCountLandscape,
  ]);

  // Depois que a impressão acontece (botão "Imprimir" ou Ctrl+P), as folhas
  // são limpas e o rascunho apagado. O navegador dispara "afterprint" também
  // quando o usuário cancela a janela de impressão, então a limpeza oferece
  // "Desfazer" para ele não perder o que digitou por engano.
  useEffect(() => {
    const onBeforePrint = () => {
      printInProgress.current = true;
    };
    const onAfterPrint = () => {
      if (!printInProgress.current) return;
      printInProgress.current = false;

      const snapshot = {
        portraitSlotes,
        portraitNotFound,
        landscapeSlotes,
        landscapeNotFound,
        printPreCountPortrait,
        printPreCountLandscape,
      };
      if (![...portraitSlotes, ...landscapeSlotes].some(isSloteFilled)) return;

      setPortraitSlotes([emptySlote(today, responsibleName), emptySlote(today, responsibleName)]);
      setPortraitNotFound([false, false]);
      setPortraitErrors([{}, {}]);
      setLandscapeSlotes([emptySlote(today, responsibleName)]);
      setLandscapeNotFound([false]);
      setLandscapeErrors([{}]);
      setPrintPreCountPortrait(false);
      setPrintPreCountLandscape(false);
      clearPrintDraft();

      toast("Folhas limpas após a impressão", {
        duration: 15000,
        action: {
          label: "Desfazer",
          onClick: () => {
            setPortraitSlotes(snapshot.portraitSlotes);
            setPortraitNotFound(snapshot.portraitNotFound);
            setPortraitErrors(snapshot.portraitSlotes.map(() => ({})));
            setLandscapeSlotes(snapshot.landscapeSlotes);
            setLandscapeNotFound(snapshot.landscapeNotFound);
            setLandscapeErrors(snapshot.landscapeSlotes.map(() => ({})));
            setPrintPreCountPortrait(snapshot.printPreCountPortrait);
            setPrintPreCountLandscape(snapshot.printPreCountLandscape);
          },
        },
      });
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [
    today,
    responsibleName,
    portraitSlotes,
    portraitNotFound,
    landscapeSlotes,
    landscapeNotFound,
    printPreCountPortrait,
    printPreCountLandscape,
  ]);

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

  // Adiciona uma folha A4 inteira de 2 slotes. Só existe no modelo
  // vertical — o horizontal é sempre 1 folha só.
  function addPage() {
    const extra = [emptySlote(today, responsibleName), emptySlote(today, responsibleName)];
    setPortraitSlotes((s) => [...s, ...extra]);
    setPortraitNotFound((n) => [...n, false, false]);
    setPortraitErrors((e) => [...e, {}, {}]);
  }

  // Remove a última folha, desde que sobre pelo menos uma.
  function removeLastPage() {
    setPortraitSlotes((s) => (s.length > 2 ? s.slice(0, s.length - 2) : s));
    setPortraitNotFound((n) => (n.length > 2 ? n.slice(0, n.length - 2) : n));
    setPortraitErrors((e) => (e.length > 2 ? e.slice(0, e.length - 2) : e));
  }

  const pages = useMemo(() => chunk(slotes, slotesPerPage), [slotes, slotesPerPage]);
  const pageFilled = pages.map((page) => page.some(isSloteFilled));
  const anyFilled = pageFilled.some(Boolean);
  // Se nenhuma folha foi preenchida ainda, caímos de volta para imprimir
  // a última folha (em vez de não imprimir nada ao clicar em "Imprimir").
  const printable = anyFilled ? pageFilled : pages.map((_, i) => i === pages.length - 1);

  // Dados da pré-contagem: código e quantidade de cada slote realmente
  // preenchido dentre os que serão enviados para a impressora.
  const preCountSource: PreCountRow[] = pages
    .flatMap((page, p) => (printable[p] ? page : []))
    .filter(isSloteFilled)
    .map((s) => ({ code: s.code ?? "", quantity: s.quantity ?? "" }));

  const preCountPages: PreCountRow[][] =
    printPreCount && preCountSource.length > 0
      ? isPortrait
        ? chunk(preCountSource, 6)
        : [preCountSource.slice(0, 1)]
      : [];

  // Uma única sequência (folhas de slote + folhas de pré-contagem) para
  // calcular corretamente onde entra "page-break-after" — a quebra só
  // pode faltar na última página que de fato será impressa, seja ela
  // slote ou pré-contagem.
  const totalUnits = pages.length + preCountPages.length;
  const unitPrintable = [...printable, ...preCountPages.map(() => true)];
  const lastPrintableIndex = unitPrintable.lastIndexOf(true, totalUnits - 1);

  function sheetClassFor(unitIndex: number, filled: boolean) {
    return [
      "print-sheet",
      !filled && "print-sheet-empty",
      unitIndex !== lastPrintableIndex && filled && "print-sheet-break",
    ]
      .filter(Boolean)
      .join(" ");
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
                  <RadioGroupItem value="portrait" id="o1" />2 slotes / A4 vertical
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="landscape" id="o2" />1 slote / A4 horizontal
                </label>
              </RadioGroup>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
                <Checkbox
                  checked={printPreCount}
                  onCheckedChange={(v) => setPrintPreCount(v === true)}
                />
                Imprimir também a pré-contagem ({isPortrait ? "vertical" : "horizontal"})
              </label>
            </div>
            <div className="text-xs text-muted-foreground max-w-xs">
              Clique dentro dos campos do slote para editar. Digite o código do produto (6 números)
              — a descrição é preenchida automaticamente pela busca. Somente as folhas com algum
              campo preenchido são impressas. Se marcar a pré-contagem, o código e a quantidade são
              puxados automaticamente do(s) slote(s) preenchido(s) e "Pré Contado Por" já sai com o
              seu nome.
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {isPortrait && (
                <Button type="button" variant="outline" size="sm" onClick={addPage}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar folha
                </Button>
              )}
              {isPortrait && pages.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={removeLastPage}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remover última folha
                </Button>
              )}
              <Button type="button" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="preview-area">
          {pages.map((page, p) => {
            const startIndex = p * slotesPerPage;
            const sheetClass = sheetClassFor(p, printable[p]);

            return (
              <div className="print-page-block" key={p}>
                {isPortrait && (
                  <div className="no-print page-block-toolbar">
                    <span className="page-block-label">
                      Folha {p + 1}
                      {!pageFilled[p] && (
                        <span className="page-block-empty-tag"> — vazia, não será impressa</span>
                      )}
                    </span>
                  </div>
                )}

                <div className="print-scale">
                  <div className={sheetClass}>
                    {page.map((s, j) => {
                      const i = startIndex + j;
                      return (
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
                      );
                    })}
                  </div>
                </div>

                <div className="no-print page-block-actions">
                  {page.map((_, j) => {
                    const i = startIndex + j;
                    return (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => clearSlote(i)}
                      >
                        Limpar slote {i + 1}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {preCountPages.map((rows, p) => {
            const unitIndex = pages.length + p;
            const sheetClass = sheetClassFor(unitIndex, true);

            return (
              <div className="print-page-block" key={`precount-${p}`}>
                <div className="no-print page-block-toolbar">
                  <span className="page-block-label">
                    Pré-contagem{preCountPages.length > 1 ? ` ${p + 1}` : ""}
                  </span>
                </div>

                <div className="print-scale precount-scale">
                  <div className={sheetClass}>
                    <PreCountSheet
                      orientation={orientation}
                      rows={rows}
                      preContadoPor={responsibleName}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
