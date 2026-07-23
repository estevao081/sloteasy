import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/app-footer";
import { LayoutDashboard, LogOut, Package, Printer, Shield } from "lucide-react";
import {
  authService,
  getToken,
  isTokenExpired,
  getTokenExpiresAt,
  getCurrentUser,
} from "@/lib/auth";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { title: "Produtos", url: "/products", icon: Package, adminOnly: false },
  { title: "Impressão", url: "/print", icon: Printer, adminOnly: false },
  { title: "Administração", url: "/admin", icon: Shield, adminOnly: true },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isAdmin = getCurrentUser()?.role === "ADMIN";
  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    function goToLogin(expired: boolean) {
      authService.logout();
      if (expired) {
        toast.error("Sua sessão expirou. Faça login novamente.");
      }
      navigate({ to: "/login" });
    }

    const token = getToken();
    if (!token) {
      goToLogin(false);
      return;
    }
    if (isTokenExpired(token)) {
      goToLogin(true);
      return;
    }

    const expiresAt = getTokenExpiresAt(token);
    if (expiresAt === null) return;

    const msUntilExpiry = expiresAt - Date.now();
    const timer = window.setTimeout(() => goToLogin(true), msUntilExpiry);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  function handleLogout() {
    authService.logout();
    navigate({ to: "/login" });
  }

  return (
    <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/20 print:block print:min-h-0">
          <Sidebar collapsible="icon" className="no-print">
            <SidebarHeader className="border-b">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                  <Printer className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Slotes</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t">
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col min-w-0 print:block">
            <header className="no-print h-14 flex items-center gap-3 border-b bg-background px-4">
              <SidebarTrigger />
              <h1 className="font-semibold text-base">{title}</h1>
            </header>
            <main className="flex-1 p-6 pb-28 print:p-0 print:m-0">{children}</main>
          </div>
        </div>
      </SidebarProvider>
      <AppFooter />
    </>
  );
}
