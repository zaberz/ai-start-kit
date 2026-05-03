import { createFileRoute, redirect } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Mail,
  Shield,
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

interface Counselor {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function FicusCounselorsPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<Counselor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "active",
  });

  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    fetchCounselors();
  }, []);

  async function fetchCounselors() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, status, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCounselors(data || []);
    } catch (error) {
      console.error("Fetch counselors error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCounselor(null);
    setFormData({ name: "", email: "", status: "active" });
    setShowModal(true);
  }

  function openEditModal(counselor: Counselor) {
    setEditingCounselor(counselor);
    setFormData({
      name: counselor.name || "",
      email: counselor.email || "",
      status: counselor.status,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) return;
    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        status: formData.status,
      };

      if (editingCounselor) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", editingCounselor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      await fetchCounselors();
    } catch (error) {
      console.error("Save counselor error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
    }
  }

  async function handleToggleActive(counselor: Counselor) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: counselor.status === "active" ? "inactive" : "active" })
        .eq("id", counselor.id);
      if (error) throw error;
      await fetchCounselors();
    } catch (error) {
      console.error("Toggle active error:", error);
      setErrorDialog({ open: true, message: "操作失败：" + (error as Error).message });
    }
  }

  function requestDelete(counselor: Counselor) {
    setConfirmDialog({
      open: true,
      title: "删除顾问",
      description: `确定删除顾问「${counselor.name}」吗？此操作不可撤销。`,
      onConfirm: () => performDelete(counselor),
    });
  }

  async function performDelete(counselor: Counselor) {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", counselor.id);
      if (error) throw error;
      await fetchCounselors();
    } catch (error) {
      console.error("Delete counselor error:", error);
      setErrorDialog({ open: true, message: "删除失败：" + (error as Error).message });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">顾问管理</h1>
          <p className="text-muted-foreground">管理门店顾问和员工信息</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="size-4 mr-2" />
          新增顾问
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counselors.length}</div>
            <p className="text-sm text-muted-foreground">总顾问数</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {counselors.filter((c) => c.status === "active").length}
            </div>
            <p className="text-sm text-muted-foreground">在职</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">
              {counselors.filter((c) => c.status !== "active").length}
            </div>
            <p className="text-sm text-muted-foreground">离职</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顾问列表</CardTitle>
          <CardDescription>共 {counselors.length} 位顾问</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {counselors.map((counselor) => (
              <div
                key={counselor.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {counselor.name || "未命名"}
                      </p>
                      {counselor.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3" />
                          {counselor.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      counselor.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {counselor.status === "active" ? "在职" : "离职"}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  ID: {counselor.id.slice(0, 8)}...
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(counselor)}
                    className="flex-1"
                  >
                    <Pencil className="size-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(counselor)}
                    className="flex-1"
                  >
                    <Shield className="size-4 mr-1" />
                    {counselor.status === "active" ? "停用" : "启用"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requestDelete(counselor)}
                    className="text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCounselor ? "编辑顾问" : "新增顾问"}
            </DialogTitle>
            <DialogDescription>
              {editingCounselor ? "修改顾问信息" : "填写信息创建新顾问"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>姓名 *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="请输入姓名"
              />
            </Field>
            <Field>
              <Label>邮箱</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="请输入邮箱"
              />
            </Field>
            {!editingCounselor && (
              <Field>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.status === "active"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? "active" : "inactive",
                      })
                    }
                    className="rounded"
                  />
                  在职
                </Label>
              </Field>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowModal(false)} variant="outline">
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
            >
              {editingCounselor ? "保存修改" : "创建顾问"}
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

export const Route = createFileRoute("/ficus/counselors")({
  component: FicusCounselorsPage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
