import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { registrationService } from "@/lib/users";
import { AppFooter } from "@/components/app-footer";

export const Route = createFileRoute("/cadastro")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Cadastro — Sistema de Slotes" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [drt, setDrt] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // A role nunca é escolhida pelo usuário: é sempre enviada como "USER".
      await registrationService.register({ drt, name, password });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o cadastro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 pb-28">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded bg-primary text-primary-foreground flex items-center justify-center mb-2">
            <Printer className="h-5 w-5" />
          </div>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Cadastre-se com seu DRT, nome e senha</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert>
              <AlertDescription>
                Cadastro realizado com sucesso! Redirecionando para o login...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="drt">DRT</Label>
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
                <Label htmlFor="name">Nome</Label>
                <Input
                  placeholder="Nome e sobrenome"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
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
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="underline underline-offset-2">
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
      <AppFooter />
    </div>
  );
}
