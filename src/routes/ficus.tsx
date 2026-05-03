import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useRouterState, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Calendar,
  UserCheck,
  LogOut,
  Shirt,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    title: "仪表板",
    href: "/ficus/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "顾客管理",
    href: "/ficus/customers",
    icon: Users,
  },
  {
    title: "订单管理",
    href: "/ficus/orders",
    icon: ShoppingCart,
  },
  {
    title: "产品管理",
    href: "/ficus/products",
    icon: Package,
  },
  {
    title: "预约管理",
    href: "/ficus/appointments",
    icon: Calendar,
  },
  {
    title: "顾问管理",
    href: "/ficus/counselors",
    icon: UserCheck,
  },
  {
    title: "营业额统计",
    href: "/ficus/revenue",
    icon: BarChart3,
  },
];

function FicusLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.navigate({ to: "/login" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="flex h-screen overflow-hidden">
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeMobile}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 bg-background border-r transform transition-all duration-300 ease-in-out lg:static lg:z-auto ${
            mobileOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64"
          } lg:translate-x-0 ${
            desktopCollapsed ? "lg:w-16" : "lg:w-64"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className={`border-b ${desktopCollapsed ? "p-3" : "p-6"}`}>
              <Link
                to="/ficus/dashboard"
                className="flex items-center gap-3"
                onClick={closeMobile}
              >
                <div className="size-10 shrink-0 rounded-xl bg-primary flex items-center justify-center">
                  <Shirt className="size-5 text-primary-foreground" />
                </div>
                {!desktopCollapsed && (
                  <div className="overflow-hidden">
                    <h1 className="text-lg font-bold">Ficus</h1>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      西装定制管理
                    </p>
                  </div>
                )}
              </Link>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={closeMobile}
                    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                      desktopCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title={desktopCollapsed ? item.title : undefined}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!desktopCollapsed && item.title}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full text-muted-foreground ${
                  desktopCollapsed ? "justify-center px-2" : "justify-start"
                }`}
                onClick={handleSignOut}
                title={desktopCollapsed ? "退出登录" : undefined}
              >
                <LogOut className="size-4 shrink-0" />
                {!desktopCollapsed && <span className="ml-2">退出登录</span>}
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden text-foreground"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
                >
                  {mobileOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden lg:flex text-foreground"
                  onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                  aria-label={
                    desktopCollapsed ? "展开侧边栏" : "收起侧边栏"
                  }
                >
                  {desktopCollapsed ? (
                    <PanelLeft className="size-5" />
                  ) : (
                    <PanelLeftClose className="size-5" />
                  )}
                </Button>
              </div>
              <div className="flex-1 lg:flex-none"></div>
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/ficus")({
  component: FicusLayout,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    console.log(data);
    
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
