import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Printer } from "lucide-react";
import { authService, isAuthenticated } from "@/lib/auth";
import { AppFooter } from "@/components/app-footer";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [drt, setDrt] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.login(drt, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/20 px-4 pb-28">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded bg-primary text-primary-foreground flex items-center justify-center mb-2">
            <Printer className="h-5 w-5" />
          </div>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse com seu ID e senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="drt">Matrícula (ID ou DRT)</Label>
              <Input
                placeholder="Ex: 445030"
                id="drt"
                value={drt}
                onChange={(e) => setDrt(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Ainda não tem uma conta?{" "}
              <Link to="/cadastro" className="underline underline-offset-2">
                Cadastre-se
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* ===== QUADRO DE NOTIFICAÇÃO =====
          Para alterar o aviso, edite apenas o texto dentro do <span> abaixo.
          Para ocultar o quadro, apague ou comente este bloco inteiro. */}
      <div className="w-full max-w-sm rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-3">
        <Bell className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Última atualização: Tempo de expiração de login aumentado de 5 para 15 minutos</span>
      </div>
      {/* ===== FIM DO QUADRO DE NOTIFICAÇÃO ===== */}

      <AppFooter />
    </div>
  );
}
