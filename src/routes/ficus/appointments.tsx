import { createFileRoute, redirect } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
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
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";

interface Appointment {
  id: number;
  event: string;
  remark: string | null;
  counselor_id: string | null;
  start_time: string;
  end_time: string | null;
  customer_id: number | null;
  archived: boolean;
  sort: number | null;
  date_created: string;
}

interface Customer {
  id: number;
  name: string;
}

interface Counselor {
  id: string;
  name: string | null;
}

const EventLabels: Record<string, { label: string; color: string }> = {
  "取西装": { label: "取西装", color: "bg-green-100 text-green-800 border-green-200" },
  "试西装": { label: "试西装", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "试尺寸": { label: "试尺寸", color: "bg-purple-100 text-purple-800 border-purple-200" },
  "量体": { label: "量体", color: "bg-orange-100 text-orange-800 border-orange-200" },
  "改衣": { label: "改衣", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  "其他": { label: "其他", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

function getEventStyle(event: string) {
  return EventLabels[event] || EventLabels["其他"];
}

function FicusAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    event: "其他",
    remark: "",
    counselor_id: "",
    start_time: "",
    end_time: "",
    customer_id: "",
  });

  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      const [apptRes, custRes, counselorRes] = await Promise.all([
        supabase.from("appointment").select("*").order("start_time", { ascending: true }),
        supabase.from("customer").select("id, name"),
        supabase.from("profiles").select("id, name").eq("status", "active"),
      ]);

      setAppointments(apptRes.data || []);
      setCustomers(custRes.data || []);
      setCounselors(counselorRes.data || []);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getCustomerName(id: number | null): string {
    if (!id) return "-";
    return customers.find((c) => c.id === id)?.name || String(id);
  }

  function getCounselorName(id: string | null): string {
    if (!id) return "-";
    const c = counselors.find((co) => co.id === id);
    return c?.name || id;
  }

  function openCreateModal() {
    setEditingAppt(null);
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData({
      event: "其他",
      remark: "",
      counselor_id: "",
      start_time: localISO,
      end_time: "",
      customer_id: "",
    });
    setShowModal(true);
  }

  function openEditModal(appt: Appointment) {
    setEditingAppt(appt);
    setFormData({
      event: appt.event,
      remark: appt.remark || "",
      counselor_id: appt.counselor_id || "",
      start_time: appt.start_time ? new Date(new Date(appt.start_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      end_time: appt.end_time ? new Date(new Date(appt.end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      customer_id: appt.customer_id ? String(appt.customer_id) : "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.start_time) return;
    try {
      const payload = {
        event: formData.event,
        remark: formData.remark || null,
        counselor_id: formData.counselor_id || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
      };
      if (editingAppt) {
        const { error } = await supabase.from("appointment").update(payload).eq("id", editingAppt.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointment").insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Save appointment error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
    }
  }

  function requestDelete(appt: Appointment) {
    setConfirmDialog({
      open: true,
      title: "删除预约",
      description: `确定删除预约「${appt.event}」吗？此操作不可撤销。`,
      onConfirm: () => performDelete(appt),
    });
  }

  async function performDelete(appt: Appointment) {
    try {
      const { error } = await supabase.from("appointment").delete().eq("id", appt.id);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error("Delete appointment error:", error);
      setErrorDialog({ open: true, message: "删除失败：" + (error as Error).message });
    }
  }

  function getCalendarDays(): { date: Date; isCurrentMonth: boolean; appointments: Appointment[] }[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean; appointments: Appointment[] }[] = [];

    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, appointments: [] });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayStart = new Date(year, month, d, 0, 0, 0);
      const dayEnd = new Date(year, month, d, 23, 59, 59);
      const dayAppts = appointments.filter((a) => {
        const start = new Date(a.start_time);
        return start >= dayStart && start <= dayEnd;
      });
      days.push({ date, isCurrentMonth: true, appointments: dayAppts });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, appointments: [] });
    }

    return days;
  }

  function navigateMonth(delta: number) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
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

  const calendarDays = getCalendarDays();
  const todayAppts = appointments.filter((a) => {
    const d = new Date(a.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">预约管理</h1>
          <p className="text-muted-foreground">管理顾客预约和日程安排</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              列表
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="size-4 mr-1" />
              日历
            </Button>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="size-4 mr-2" />
            新增预约
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{appointments.filter((a) => !a.archived).length}</div>
            <p className="text-sm text-muted-foreground">总预约数</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{todayAppts.length}</div>
            <p className="text-sm text-muted-foreground">今日预约</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter((a) => a.event === "取西装" && !a.archived).length}
            </div>
            <p className="text-sm text-muted-foreground">待取衣</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {appointments.filter((a) => a.event === "试西装" && !a.archived).length}
            </div>
            <p className="text-sm text-muted-foreground">待试衣</p>
          </CardContent>
        </Card>
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>预约列表</CardTitle>
            <CardDescription>共 {appointments.length} 条预约</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">活动</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">顾客</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">顾问</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">开始时间</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">结束时间</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">备注</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => {
                    const style = getEventStyle(appt.event);
                    return (
                      <tr key={appt.id} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium">{getCustomerName(appt.customer_id)}</td>
                        <td className="py-4 px-4">{getCounselorName(appt.counselor_id)}</td>
                        <td className="py-4 px-4 text-sm">
                          {new Date(appt.start_time).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {appt.end_time
                            ? new Date(appt.end_time).toLocaleString("zh-CN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground max-w-32 truncate">
                          {appt.remark || "-"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(appt)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => requestDelete(appt)} className="text-red-600">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  今天
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`bg-background min-h-24 p-2 ${
                      !day.isCurrentMonth ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        isToday
                          ? "bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center font-bold"
                          : ""
                      }`}
                    >
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {day.appointments.slice(0, 3).map((appt) => {
                        const style = getEventStyle(appt.event);
                        return (
                          <div
                            key={appt.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer ${style.color}`}
                            onClick={() => openEditModal(appt)}
                          >
                            {new Date(appt.start_time).toLocaleTimeString("zh-CN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            {appt.event}
                          </div>
                        );
                      })}
                      {day.appointments.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{day.appointments.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppt ? "编辑预约" : "新增预约"}</DialogTitle>
            <DialogDescription>
              {editingAppt ? "修改预约信息" : "填写预约信息创建新预约"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>活动类型 *</Label>
              <select
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="取西装">取西装</option>
                <option value="试西装">试西装</option>
                <option value="试尺寸">试尺寸</option>
                <option value="量体">量体</option>
                <option value="改衣">改衣</option>
                <option value="其他">其他</option>
              </select>
            </Field>
            <Field>
              <Label>顾客</Label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">选择顾客</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>顾问</Label>
              <select
                value={formData.counselor_id}
                onChange={(e) => setFormData({ ...formData, counselor_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">选择顾问</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>开始时间 *</Label>
              <Input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </Field>
            <Field>
              <Label>结束时间</Label>
              <Input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </Field>
            <Field>
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="可选备注"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowModal(false)} variant="outline">
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.start_time}>
              {editingAppt ? "保存修改" : "创建预约"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>操作失败</AlertDialogTitle>
            <AlertDialogDescription>{errorDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDialog.onConfirm}
            >
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Route = createFileRoute("/ficus/appointments")({
  component: FicusAppointmentsPage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
