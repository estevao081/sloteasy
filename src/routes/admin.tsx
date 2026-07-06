import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { userService, type User, type UserRole } from "@/lib/users";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração — Sistema de Slotes" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newDrt, setNewDrt] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("USER");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editing, setEditing] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editDrt, setEditDrt] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("USER");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.list();
      setItems(res);
    } catch (err) {
      setError((err as Error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function onEdit(u: User) {
    setEditing(u);
    setEditName(u.name ?? "");
    setEditDrt(u.drt ?? "");
    setEditRole(u.role ?? "USER");
    setEditError(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.id) return;
    setSaving(true);
    setEditError(null);
    try {
      await userService.update(editing.id, {
        name: editName,
        drt: editDrt,
        role: editRole,
      });
      setEditing(null);
      await refresh();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(u: User) {
    if (u.id == null) return;
    if (!confirm(`Remover usuário ${u.name}?`)) return;
    try {
      await userService.remove(u.id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await userService.create({
        drt: newDrt,
        name: newName,
        password: newPassword,
        role: newRole,
      });
      setNewDrt("");
      setNewName("");
      setNewPassword("");
      setNewRole("USER");
      await refresh();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title="Administração">
      <div className="space-y-6 max-w-5xl">
        <Card>
          <CardContent className="p-6">
            <form
              onSubmit={onCreate}
              className="grid gap-4 sm:grid-cols-[140px_1fr_1fr_140px_auto] items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="new-drt">DRT</Label>
                <Input
                  id="new-drt"
                  required
                  value={newDrt}
                  onChange={(e) => setNewDrt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Nome</Label>
                <Input
                  id="new-name"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Cadastrando..." : "Cadastrar Usuário"}
              </Button>
              {createError && (
                <p className="text-sm text-destructive sm:col-span-5">{createError}</p>
              )}
            </form>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-6 space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-40">DRT</TableHead>
                  <TableHead className="w-32">Role</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  items.map((u) => (
                    <TableRow key={u.id ?? u.drt}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell className="font-mono">{u.drt}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(u)}>
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

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-drt">DRT</Label>
              <Input
                id="edit-drt"
                value={editDrt}
                onChange={(e) => setEditDrt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
