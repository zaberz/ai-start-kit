import { createFileRoute, redirect } from "@tanstack/react-router";

import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  real_price: number;
  total_price: number;
  user_id: string | null;
  counselor_name: string | null;
  date_created: string;
}

interface CounselorRevenue {
  counselor_name: string;
  order_count: number;
  total_real_price: number;
  total_original_price: number;
}

interface MonthlyRevenue {
  month: string;
  order_count: number;
  total_real_price: number;
  total_original_price: number;
}

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: formatDateISO(start),
    end: formatDateISO(end),
  };
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}年${parseInt(month)}月`;
}

function FicusRevenuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().start);
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().end);

  useEffect(() => {
    fetchPeriodOrders();
    fetchMonthlyOrders();
  }, []);

  useEffect(() => {
    fetchPeriodOrders();
  }, [startDate, endDate]);

  async function fetchPeriodOrders() {
    try {
      const start = new Date(startDate + "T00:00:00").toISOString();
      const end = new Date(endDate + "T23:59:59").toISOString();
      const { data, error } = await supabase
        .from("order")
        .select("id, real_price, total_price, user_id, counselor_name, date_created")
        .gte("date_created", start)
        .lte("date_created", end)
        .order("date_created", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Fetch period orders error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMonthlyOrders() {
    try {
      const { data, error } = await supabase
        .from("order")
        .select("id, real_price, total_price, user_id, counselor_name, date_created")
        .order("date_created", { ascending: false });
      if (error) throw error;
      setMonthlyOrders(data || []);
    } catch (error) {
      console.error("Fetch monthly orders error:", error);
    }
  }

  const counselorRevenues = useMemo<CounselorRevenue[]>(() => {
    const map = new Map<string, CounselorRevenue>();
    for (const o of orders) {
      const name = o.counselor_name || "未分配顾问";
      const existing = map.get(name);
      if (existing) {
        existing.order_count += 1;
        existing.total_real_price += o.real_price || 0;
        existing.total_original_price += o.total_price || 0;
      } else {
        map.set(name, {
          counselor_name: name,
          order_count: 1,
          total_real_price: o.real_price || 0,
          total_original_price: o.total_price || 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total_real_price - a.total_real_price);
  }, [orders]);

  const monthlyRevenues = useMemo<MonthlyRevenue[]>(() => {
    const map = new Map<string, MonthlyRevenue>();
    for (const o of monthlyOrders) {
      const d = new Date(o.date_created);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = map.get(monthKey);
      if (existing) {
        existing.order_count += 1;
        existing.total_real_price += o.real_price || 0;
        existing.total_original_price += o.total_price || 0;
      } else {
        map.set(monthKey, {
          month: monthKey,
          order_count: 1,
          total_real_price: o.real_price || 0,
          total_original_price: o.total_price || 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [monthlyOrders]);

  const periodTotalReal = orders.reduce((s, o) => s + (o.real_price || 0), 0);
  const periodTotalOriginal = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const periodOrderCount = orders.length;

  function setQuickRange(range: "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let start: Date;
    let end: Date;

    switch (range) {
      case "thisMonth":
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
        break;
      case "lastMonth":
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
        break;
      case "thisQuarter": {
        const quarterStart = Math.floor(month / 3) * 3;
        start = new Date(year, quarterStart, 1);
        end = new Date(year, quarterStart + 3, 0);
        break;
      }
      case "thisYear":
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
        break;
    }

    setStartDate(formatDateISO(start));
    setEndDate(formatDateISO(end));
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
        <h1 className="text-2xl font-bold">营业额统计</h1>
        <p className="text-muted-foreground hidden sm:block">按顾问和月份查看营业额数据</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">开始日期</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <span className="pb-2 text-muted-foreground">至</span>
            <div className="flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">结束日期</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setQuickRange("thisMonth")}>
            本月
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickRange("lastMonth")}>
            上月
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickRange("thisQuarter")}>
            本季度
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickRange("thisYear")}>
            本年
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="size-4 text-green-600" />
              <span className="text-sm text-muted-foreground">实付总额</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ¥{periodTotalReal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">原始总额</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ¥{periodTotalOriginal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="size-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">订单数</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {periodOrderCount}
            </div>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">顾问数</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {counselorRevenues.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>顾问营业额</CardTitle>
              <CardDescription>
                {startDate} 至 {endDate} 各顾问营业额
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              共 {counselorRevenues.length} 位顾问
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {counselorRevenues.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">该时间段暂无订单数据</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">排名</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">顾问</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">订单数</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">原始金额</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">实付金额</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counselorRevenues.map((c, index) => (
                      <tr key={c.counselor_name} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-600" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium">{c.counselor_name}</td>
                        <td className="py-4 px-4 text-right">{c.order_count}</td>
                        <td className="py-4 px-4 text-right">¥{c.total_original_price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right font-bold">¥{c.total_real_price.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right">
                          {periodTotalReal > 0
                            ? ((c.total_real_price / periodTotalReal) * 100).toFixed(1)
                            : "0.0"}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 font-bold">
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4">合计</td>
                      <td className="py-3 px-4 text-right">{periodOrderCount}</td>
                      <td className="py-3 px-4 text-right">¥{periodTotalOriginal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">¥{periodTotalReal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {counselorRevenues.map((c, index) => (
                  <div key={c.counselor_name} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-bold ${
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{c.counselor_name}</span>
                      </div>
                      <span className="font-bold">¥{c.total_real_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{c.order_count} 单</span>
                      <span>
                        占比 {periodTotalReal > 0 ? ((c.total_real_price / periodTotalReal) * 100).toFixed(1) : "0.0"}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between font-bold">
                    <span>合计</span>
                    <span>¥{periodTotalReal.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{periodOrderCount} 单</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                月度营业额汇总
              </CardTitle>
              <CardDescription>各月营业额总览</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              共 {monthlyRevenues.length} 个月
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyRevenues.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">暂无订单数据</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">月份</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">订单数</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">原始金额</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">实付金额</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">环比变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRevenues.map((m, index) => {
                      const prevMonth = monthlyRevenues[index + 1];
                      const change = prevMonth
                        ? prevMonth.total_real_price > 0
                          ? ((m.total_real_price - prevMonth.total_real_price) / prevMonth.total_real_price) * 100
                          : m.total_real_price > 0
                            ? 100
                            : 0
                        : null;

                      return (
                        <tr key={m.month} className="border-b hover:bg-muted/50">
                          <td className="py-4 px-4 font-medium">{formatMonthLabel(m.month)}</td>
                          <td className="py-4 px-4 text-right">{m.order_count}</td>
                          <td className="py-4 px-4 text-right">¥{m.total_original_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-bold">¥{m.total_real_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right">
                            {change !== null ? (
                              <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                                {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 font-bold">
                      <td className="py-3 px-4">总计</td>
                      <td className="py-3 px-4 text-right">
                        {monthlyRevenues.reduce((s, m) => s + m.order_count, 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ¥{monthlyRevenues.reduce((s, m) => s + m.total_original_price, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ¥{monthlyRevenues.reduce((s, m) => s + m.total_real_price, 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {monthlyRevenues.map((m, index) => {
                  const prevMonth = monthlyRevenues[index + 1];
                  const change = prevMonth
                    ? prevMonth.total_real_price > 0
                      ? ((m.total_real_price - prevMonth.total_real_price) / prevMonth.total_real_price) * 100
                      : m.total_real_price > 0
                        ? 100
                        : 0
                    : null;

                  return (
                    <div key={m.month} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatMonthLabel(m.month)}</span>
                        <span className="font-bold">¥{m.total_real_price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{m.order_count} 单</span>
                        {change !== null ? (
                          <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between font-bold">
                    <span>总计</span>
                    <span>¥{monthlyRevenues.reduce((s, m) => s + m.total_real_price, 0).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {monthlyRevenues.reduce((s, m) => s + m.order_count, 0)} 单
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/ficus/revenue")({
  component: FicusRevenuePage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
