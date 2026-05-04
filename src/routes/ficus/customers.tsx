import { createFileRoute, redirect } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Heart,
  MapPin,
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
import { Pagination } from "@/components/ui/pagination";
import { useDebouncedValue } from "@/lib/use-debounced-value";

interface Customer {
  id: number;
  name: string;
  phone: string;
  remark: string | null;
  wedding_date: string | null;
  address: string | null;
  date_created: string;
  date_updated: string | null;
}

function FicusCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 1000);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    remark: "",
    wedding_date: "",
    address: "",
  });

  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchCustomers();
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  async function fetchCustomers() {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("customer")
        .select("*", { count: "exact" })
        .order("date_created", { ascending: false })
        .range(from, to);

      if (debouncedSearch.trim()) {
        const q = `%${debouncedSearch.trim()}%`;
        query = query.or(`name.ilike.${q},phone.ilike.${q},remark.ilike.${q}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Fetch customers error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", remark: "", wedding_date: "", address: "" });
    setShowModal(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      remark: customer.remark || "",
      wedding_date: customer.wedding_date || "",
      address: customer.address || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.phone.trim()) return;

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        remark: formData.remark || null,
        wedding_date: formData.wedding_date || null,
        address: formData.address || null,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from("customer")
          .update(payload)
          .eq("id", editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer").insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      await fetchCustomers();
    } catch (error) {
      console.error("Save customer error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
    }
  }

  function requestDelete(customer: Customer) {
    setConfirmDialog({
      open: true,
      title: "删除顾客",
      description: `确定删除顾客「${customer.name}」吗？此操作不可撤销。`,
      onConfirm: () => performDelete(customer),
    });
  }

  async function performDelete(customer: Customer) {
    try {
      const { error } = await supabase
        .from("customer")
        .delete()
        .eq("id", customer.id);
      if (error) throw error;
      await fetchCustomers();
    } catch (error) {
      console.error("Delete customer error:", error);
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
          <h1 className="text-2xl font-bold">顾客管理</h1>
          <p className="text-muted-foreground hidden sm:block">管理顾客信息和客户资源</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="size-4 mr-2" />
          <span className="hidden sm:inline">新增顾客</span>
          <span className="sm:hidden">新增</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>顾客列表</CardTitle>
              <CardDescription>共 {totalCount} 位顾客</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、电话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">姓名</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">电话</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">婚期</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">地址</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">备注</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">创建时间</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{customer.name}</td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground" />
                        {customer.phone}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {customer.wedding_date ? (
                        <span className="flex items-center gap-1">
                          <Heart className="size-3 text-pink-500" />
                          {new Date(customer.wedding_date).toLocaleDateString("zh-CN")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {customer.address ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="size-3 text-muted-foreground" />
                          {customer.address}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground max-w-48 truncate">
                      {customer.remark || "-"}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(customer.date_created).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(customer)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requestDelete(customer)}
                          className="text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {customers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-base">{customer.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(customer)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => requestDelete(customer)} className="text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="size-3" />
                  {customer.phone}
                </div>
                {customer.wedding_date && (
                  <div className="flex items-center gap-1 text-sm">
                    <Heart className="size-3 text-pink-500" />
                    {new Date(customer.wedding_date).toLocaleDateString("zh-CN")}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={totalCount} onChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "编辑顾客" : "新增顾客"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "修改顾客信息" : "填写信息创建新顾客"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>姓名 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入顾客姓名"
              />
            </Field>
            <Field>
              <Label>电话 *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </Field>
            <Field>
              <Label>婚期</Label>
              <Input
                type="date"
                value={formData.wedding_date}
                onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
              />
            </Field>
            <Field>
              <Label>地址</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入地址"
              />
            </Field>
            <Field>
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="请输入备注"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowModal(false)} variant="outline">
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.phone.trim()}
            >
              {editingCustomer ? "保存修改" : "创建顾客"}
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

export const Route = createFileRoute("/ficus/customers")({
  component: FicusCustomersPage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
