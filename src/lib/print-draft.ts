import type { SloteData } from "@/components/slote-preview";
import { getCurrentUser } from "@/lib/auth";

// Rascunho das folhas de slote: guarda no navegador (localStorage) tudo o que
// o usuário digitou na tela de impressão, para que não se perca ao navegar
// para outra aba (ex.: cadastrar produto), recarregar a página ou ter a sessão
// expirada. O rascunho é apagado depois que a impressão acontece.
//
// A chave inclui a matrícula (DRT) do usuário, para que duas pessoas que usam
// o mesmo navegador nunca vejam o rascunho uma da outra.

const KEY_PREFIX = "sloteasy_print_draft";

export interface PrintDraft {
  orientation: "portrait" | "landscape";
  portraitSlotes: SloteData[];
  portraitNotFound: boolean[];
  landscapeSlotes: SloteData[];
  landscapeNotFound: boolean[];
  printPreCountPortrait: boolean;
  printPreCountLandscape: boolean;
}

function storageKey(): string | null {
  if (typeof window === "undefined") return null;
  const user = getCurrentUser();
  const id = user?.drt?.trim() || user?.name?.trim();
  return id ? `${KEY_PREFIX}:${id}` : null;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

function sanitizeSlotes(raw: unknown, date: string, responsibleName: string): SloteData[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((r) => {
    const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    return {
      responsibleName,
      code: str(o.code),
      description: str(o.description),
      quantity: str(o.quantity),
      validity: str(o.validity),
      date,
    };
  });
}

function sanitizeFlags(raw: unknown, length: number): boolean[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length }, (_, i) => arr[i] === true);
}

/** Lê o rascunho salvo. Retorna null se não existir ou estiver inválido. */
export function loadPrintDraft(date: string, responsibleName: string): PrintDraft | null {
  const key = storageKey();
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;

    const portraitSlotes = sanitizeSlotes(d.portraitSlotes, date, responsibleName);
    const landscapeSlotes = sanitizeSlotes(d.landscapeSlotes, date, responsibleName);
    // Modelo vertical: sempre folhas inteiras de 2 slotes. Horizontal: 1 slote.
    if (!portraitSlotes || portraitSlotes.length < 2 || portraitSlotes.length % 2 !== 0) {
      return null;
    }
    if (!landscapeSlotes || landscapeSlotes.length !== 1) return null;

    return {
      orientation: d.orientation === "landscape" ? "landscape" : "portrait",
      portraitSlotes,
      portraitNotFound: sanitizeFlags(d.portraitNotFound, portraitSlotes.length),
      landscapeSlotes,
      landscapeNotFound: sanitizeFlags(d.landscapeNotFound, landscapeSlotes.length),
      printPreCountPortrait: d.printPreCountPortrait === true,
      printPreCountLandscape: d.printPreCountLandscape === true,
    };
  } catch {
    return null;
  }
}

/** Salva o rascunho. Falhas (cota cheia, modo privado) são ignoradas. */
export function savePrintDraft(draft: PrintDraft): void {
  const key = storageKey();
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function clearPrintDraft(): void {
  const key = storageKey();
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
