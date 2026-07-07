import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
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
import { LayoutDashboard, Package, Printer, Shield } from "lucide-react";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Impressão", url: "/print", icon: Printer },
  { title: "Administração", url: "/admin", icon: Shield },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
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
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 print:block">
          <header className="no-print h-14 flex items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-base">{title}</h1>
          </header>
          <main className="flex-1 p-6 print:p-0 print:m-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
