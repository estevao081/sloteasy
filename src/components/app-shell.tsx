import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
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
import { LayoutDashboard, Package, Printer, LogOut } from "lucide-react";
import { authService } from "@/lib/auth";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Impressão", url: "/print", icon: Printer },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;

  function handleLogout() {
    authService.logout();
    navigate({ to: "/login" });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
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
                  {items.map((item) => (
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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="no-print h-14 flex items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-base">{title}</h1>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
