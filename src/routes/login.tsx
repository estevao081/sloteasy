import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/lib/auth";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Sistema de Slotes" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authService.isAuthenticated()) navigate({ to: "/dashboard" });
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      authService.login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <Printer className="h-6 w-6" />
          </div>
          <CardTitle>Sistema de Impressão de Slotes</CardTitle>
          <p className="text-sm text-muted-foreground">Acesse sua conta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <Button asChild type="button" variant="outline" className="w-full">
              <Link to="/register">Criar conta</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
