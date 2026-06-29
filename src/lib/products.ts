export interface Product {
  code: string;
  name: string;
}

const KEY = "slotes:products";

function read(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {}
  // seed
  const seed: Product[] = [
    { code: "117170", name: "MASSA DE CECCO 500G ITA PAPPARDELLE" },
    { code: "100001", name: "ARROZ TIO JOAO 5KG" },
    { code: "100002", name: "FEIJAO CARIOCA CAMIL 1KG" },
  ];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function write(items: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const productService = {
  list(): Product[] {
    return read();
  },
  getByCode(code: string): Product | null {
    return read().find((p) => p.code === code) ?? null;
  },
  create(p: Product): Product {
    const items = read();
    if (items.some((x) => x.code === p.code)) throw new Error("Código já cadastrado");
    items.push(p);
    write(items);
    return p;
  },
  update(code: string, p: Product): Product {
    const items = read();
    const idx = items.findIndex((x) => x.code === code);
    if (idx < 0) throw new Error("Produto não encontrado");
    items[idx] = p;
    write(items);
    return p;
  },
  remove(code: string): void {
    write(read().filter((p) => p.code !== code));
  },
};
