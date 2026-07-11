import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Printer, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Sistema de Slotes" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const isAdmin = getCurrentUser()?.role === "ADMIN";

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-6 sm:grid-cols-2 max-w-3xl">
        <Link to="/products">
          <Card className="hover:border-primary hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-3">
              <Package className="h-12 w-12 text-primary" />
              <h2 className="text-lg font-semibold">Produtos</h2>
              <p className="text-sm text-muted-foreground">Cadastre e gerencie produtos</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/print">
          <Card className="hover:border-primary hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-3">
              <Printer className="h-12 w-12 text-primary" />
              <h2 className="text-lg font-semibold">Impressão de Slotes</h2>
              <p className="text-sm text-muted-foreground">Gere e imprima slotes de estoque</p>
            </CardContent>
          </Card>
        </Link>
        {isAdmin && (
          <Link to="/admin">
            <Card className="hover:border-primary hover:shadow-md transition cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center text-center gap-3">
                <Shield className="h-12 w-12 text-primary" />
                <h2 className="text-lg font-semibold">Administração</h2>
                <p className="text-sm text-muted-foreground">Gerencie usuários do sistema</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </AppShell>
  );
}