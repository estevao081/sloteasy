import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Search } from "lucide-react";
import { productService, type Product } from "@/lib/products";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Produtos — Sistema de Slotes" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [items, setItems] = useState<Product[]>(() => productService.list());
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [items, search]);

  function reset() {
    setCode("");
    setName("");
    setEditing(null);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        productService.update(editing, { code, name });
      } else {
        productService.create({ code, name });
      }
      setItems(productService.list());
      reset();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function onEdit(p: Product) {
    setEditing(p.code);
    setCode(p.code);
    setName(p.name);
  }

  function onDelete(p: Product) {
    if (!confirm(`Excluir produto ${p.code}?`)) return;
    productService.remove(p.code);
    setItems(productService.list());
  }

  return (
    <AppShell title="Produtos">
      <div className="space-y-6 max-w-5xl">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[160px_1fr_auto] items-end">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  required
                  value={code}
                  disabled={!!editing}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editing ? "Salvar" : "Cadastrar Produto"}</Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancelar
                  </Button>
                )}
              </div>
              {error && <p className="text-sm text-destructive sm:col-span-3">{error}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por código ou nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => (
                  <TableRow key={p.code}>
                    <TableCell className="font-mono">{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => onEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(p)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
