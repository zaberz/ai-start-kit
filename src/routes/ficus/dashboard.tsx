import { createFileRoute, redirect } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import {
  Users,
  ShoppingCart,
  Calendar,
  Package,
  Clock,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Link } from "@tanstack/react-router";

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  todayAppointments: number;
  totalProducts: number;
  todayOrders: number;
  pendingPayments: number;
  activeCounselors: number;
}

interface RecentOrder {
  id: string;
  real_price: number;
  customer_name: string | null;
  counselor_name: string;
  date_created: string;
}

interface TodayAppointment {
  id: number;
  event: string;
  start_time: string;
  customer_name: string | null;
  remark: string | null;
}

function FicusDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalOrders: 0,
    todayAppointments: 0,
    totalProducts: 0,
    todayOrders: 0,
    pendingPayments: 0,
    activeCounselors: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const tomorrowISO = new Date(today.getTime() + 86400000).toISOString();

      const [customersRes, ordersCountRes, todayOrdersRes, productsRes, counselorsRes, appointmentsRes] =
        await Promise.all([
          supabase.from("customer").select("*", { count: "exact", head: true }),
          supabase.from("order").select("*", { count: "exact", head: true }),
          supabase.from("order").select("id", { count: "exact", head: true }).gte("date_created", todayISO).lt("date_created", tomorrowISO),
          supabase.from("sku").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("appointment").select("id, event, start_time, remark, customer:customer_id(name)").gte("start_time", todayISO).lt("start_time", tomorrowISO).order("date_created", { ascending: false }),
        ]);

      const todayAppts = (appointmentsRes.data || []).map((a: any) => ({
        id: a.id,
        event: a.event,
        start_time: a.start_time,
        remark: a.remark,
        customer_name: a.customer?.name || null,
      }));

      setStats({
        totalCustomers: customersRes.count || 0,
        totalOrders: ordersCountRes.count || 0,
        todayAppointments: todayAppts.length,
        totalProducts: productsRes.count || 0,
        todayOrders: todayOrdersRes.count || 0,
        pendingPayments: 0,
        activeCounselors: counselorsRes.count || 0,
      });

      setTodayAppointments(todayAppts);

      const { data: recentOrdersData } = await supabase
        .from("order")
        .select("id, real_price, counselor_name, date_created, customer:customer_id(name)")
        .order("date_created", { ascending: false })
        .limit(5);

      const mapped = (recentOrdersData || []).map((o: any) => ({
        id: o.id,
        real_price: o.real_price,
        counselor_name: o.counselor_name,
        date_created: o.date_created,
        customer_name: o.customer?.name || null,
      }));

      setRecentOrders(mapped);
    } catch (error) {
      console.error("Fetch dashboard data error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表板</h1>
        <p className="text-muted-foreground">西装定制业务数据概览</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近订单</CardTitle>
              <Link
                to="/ficus/orders"
                className="text-sm text-primary hover:underline"
              >
                查看全部
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">暂无订单</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {order.customer_name || "未知顾客"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        顾问: {order.counselor_name || "-"} ·{" "}
                        {new Date(order.date_created).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">¥{order.real_price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>今日预约</CardTitle>
              <Link
                to="/ficus/appointments"
                className="text-sm text-primary hover:underline"
              >
                查看全部
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">今日无预约</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{appt.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {appt.customer_name || "未知顾客"}{appt.remark ? ` · ${appt.remark}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(appt.start_time).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                今日订单
              </CardTitle>
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Clock className="size-4 text-emerald-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                今日预约
              </CardTitle>
              <div className="bg-orange-50 p-2 rounded-lg">
                <Calendar className="size-4 text-orange-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link to="/ficus/appointments" className="text-primary hover:underline">
                查看预约 →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                顾客总数
              </CardTitle>
              <div className="bg-blue-50 p-2 rounded-lg">
                <Users className="size-4 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link to="/ficus/customers" className="text-primary hover:underline">
                查看全部 →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                订单总数
              </CardTitle>
              <div className="bg-green-50 p-2 rounded-lg">
                <ShoppingCart className="size-4 text-green-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              今日新增 <span className="text-green-600 font-medium">{stats.todayOrders}</span> 单
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                产品数量
              </CardTitle>
              <div className="bg-cyan-50 p-2 rounded-lg">
                <Package className="size-4 text-cyan-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                在职顾问
              </CardTitle>
              <div className="bg-pink-50 p-2 rounded-lg">
                <UserCheck className="size-4 text-pink-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCounselors}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/ficus/dashboard")({
  component: FicusDashboardPage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
