import { createFileRoute, redirect, Link } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  DollarSign,
  Clock,
  CreditCard,
  FileText,
  UserPlus,
  Trash2,
  Printer,
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  real_price: number;
  total_price: number;
  customer_id: number | null;
  customer_name: string | null;
  user_id: string | null;
  counselor_name: string | null;
  pay_type: string | null;
  remark: string | null;
  date_created: string;
  date_updated: string | null;
}

interface OrderSkuDetail {
  id: number;
  order_id: string;
  sku_id: number | null;
  classify_id: number | null;
  color_id: number | null;
  shazhi_id: number | null;
  price: number | null;
  mianliao_bianhao: string | null;
}

interface OrderPayment {
  id: number;
  order_id: string;
  price: number | null;
  show_counselor_name: string | null;
  date_created: string;
}

interface OrderProgress {
  id: number;
  order_id: string;
  mianliao_price: number | null;
  maopi_daohuo_time: string | null;
  xizhuang_xiadan_time: string | null;
  fanchang_time: string | null;
  chengyi_daohuo_time: string | null;
  gongyi_price: number | null;
  chenshan_mianliao_xiadan_time: string | null;
  chenshan_mianliao_price: number | null;
  chenshan_changjia: string | null;
  chenshan_xiadan_time: string | null;
  chenshan_daohuo_time: string | null;
  chenshan_gongyi_price: number | null;
  peijian_xiadan_time: string | null;
  peijian_daohuo_time: string | null;
  peijian_price: string | null;
  xizhuang_mianliao: string | null;
  xizhuang_mianliao_bianhao: string | null;
  mianliao_xiadan_time: string | null;
  xizhuang_changjia: string | null;
  chenshan_mianliao_bianhao: string | null;
  peijian_bianhao: string | null;
  quyi_time: string | null;
  quyi_content: string | null;
  beizhu: string | null;
  maopi_daohuo_time2: string | null;
  guke_name: string | null;
  date_created: string;
}

interface RefItem {
  id: number;
  name: string;
}

interface CustomerOption {
  id: number;
  name: string;
  phone: string;
}

interface CounselorOption {
  id: string;
  name: string | null;
}

interface SkuClassifyPrice {
  id: number;
  sku_id: number;
  classify_id: number;
  price: number;
}

interface SkuWithCode {
  id: number;
  name: string;
  code: string | null;
}

interface OrderFormItem {
  key: string;
  sku_id: string;
  classify_id: string;
  color_id: string;
  shazhi_id: string;
  price: number;
  mianliao_bianhao: string;
}

const PaymentMethodLabels: Record<string, string> = {
  cash: "现金",
  wechat: "微信",
  alipay: "支付宝",
  card: "银行卡",
  other: "其他",
};

function FicusOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderSkuDetail[]>([]);
  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  const [orderProgresses, setOrderProgresses] = useState<OrderProgress[]>([]);
  const [detailTab, setDetailTab] = useState<"details" | "payments" | "progress">("details");
  const [paymentForm, setPaymentForm] = useState({ price: "", show_counselor_name: "" });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [counselors, setCounselors] = useState<CounselorOption[]>([]);
  const [skus, setSkus] = useState<RefItem[]>([]);
  const [skusWithCode, setSkusWithCode] = useState<SkuWithCode[]>([]);
  const [classifies, setClassifies] = useState<RefItem[]>([]);
  const [colors, setColors] = useState<RefItem[]>([]);
  const [shazhis, setShazhis] = useState<RefItem[]>([]);
  const [skuPrices, setSkuPrices] = useState<SkuClassifyPrice[]>([]);
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([]);
  const [createOrderForm, setCreateOrderForm] = useState({
    customer_id: "",
    counselor_id: "",
    total_price: "",
    real_price: "",
    pay_type: "",
    remark: "",
  });
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    remark: "",
    wedding_date: "",
    address: "",
  });

  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchCounselors();
    fetchRefData();
  }, []);

  useEffect(() => {
    let result = [...orders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.counselor_name?.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }
    setFilteredOrders(result);
  }, [searchQuery, orders]);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from("order")
        .select("*")
        .order("date_created", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from("customer")
        .select("id, name, phone")
        .order("name");
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  }

  async function fetchCounselors() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      setCounselors(data || []);
    } catch (error) {
      console.error("Fetch counselors error:", error);
    }
  }

  async function fetchRefData() {
    try {
      const [skuRes, clsRes, colorRes, shazhiRes, priceRes] = await Promise.all([
        supabase.from("sku").select("id, name, code"),
        supabase.from("classify").select("id, name"),
        supabase.from("tag_color").select("id, name"),
        supabase.from("tag_shazhi").select("id, name"),
        supabase.from("sku_classify_price").select("id, sku_id, classify_id, price"),
      ]);
      setSkusWithCode(skuRes.data || []);
      setSkus((skuRes.data || []).map((s: SkuWithCode) => ({ id: s.id, name: s.name })));
      setClassifies(clsRes.data || []);
      setColors(colorRes.data || []);
      setShazhis(shazhiRes.data || []);
      setSkuPrices(priceRes.data || []);
    } catch (error) {
      console.error("Fetch ref data error:", error);
    }
  }

  function getSkuName(id: number | null): string {
    if (!id) return "-";
    return skus.find((s) => s.id === id)?.name || String(id);
  }

  function getClassifyName(id: number | null): string {
    if (!id) return "-";
    return classifies.find((c) => c.id === id)?.name || String(id);
  }

  function getColorName(id: number | null): string {
    if (!id) return "-";
    return colors.find((c) => c.id === id)?.name || String(id);
  }

  function getShazhiName(id: number | null): string {
    if (!id) return "-";
    return shazhis.find((s) => s.id === id)?.name || String(id);
  }

  function openCreateOrderModal() {
    setCreateOrderForm({
      customer_id: "",
      counselor_id: "",
      total_price: "",
      real_price: "",
      pay_type: "",
      remark: "",
    });
    setOrderItems([]);
    setShowCreateModal(true);
  }

  function addOrderItem() {
    setOrderItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        sku_id: "",
        classify_id: "",
        color_id: "",
        shazhi_id: "",
        price: 0,
        mianliao_bianhao: "",
      },
    ]);
  }

  function removeOrderItem(key: string) {
    setOrderItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateOrderItem(key: string, field: keyof OrderFormItem, value: string | number) {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        if (field === "sku_id" || field === "classify_id") {
          const skuId = field === "sku_id" ? Number(value) : Number(item.sku_id);
          const classifyId = field === "classify_id" ? Number(value) : Number(item.classify_id);
          if (skuId && classifyId) {
            const found = skuPrices.find(
              (p) => p.sku_id === skuId && p.classify_id === classifyId
            );
            updated.price = found ? found.price : 0;
          } else {
            updated.price = 0;
          }
        }

        if (field === "sku_id" && value) {
          const sku = skusWithCode.find((s) => s.id === Number(value));
          if (sku?.code) {
            updated.mianliao_bianhao = sku.code;
          }
        }

        return updated;
      })
    );
  }

  function calcTotalPrice(): number {
    return orderItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }

  async function handleCreateOrder() {
    if (!createOrderForm.customer_id) return;
    try {
      const totalPrice = calcTotalPrice();
      const selectedCustomer = customers.find((c) => c.id === parseInt(createOrderForm.customer_id));
      const selectedCounselor = counselors.find((c) => c.id === createOrderForm.counselor_id);
      const payload = {
        customer_id: parseInt(createOrderForm.customer_id),
        customer_name: selectedCustomer?.name || null,
        user_id: createOrderForm.counselor_id || null,
        counselor_name: selectedCounselor?.name || null,
        total_price: totalPrice || 0,
        real_price: createOrderForm.real_price
          ? parseFloat(createOrderForm.real_price)
          : totalPrice || 0,
        pay_type: createOrderForm.pay_type || null,
        remark: createOrderForm.remark || null,
      };
      const { data: orderData, error: orderError } = await supabase
        .from("order")
        .insert([payload])
        .select("id")
        .single();
      if (orderError) throw orderError;

      if (orderData && orderItems.length > 0) {
        const detailPayloads = orderItems
          .filter((item) => item.sku_id && item.classify_id)
          .map((item) => ({
            order_id: orderData.id,
            sku_id: parseInt(item.sku_id),
            classify_id: parseInt(item.classify_id),
            color_id: item.color_id ? parseInt(item.color_id) : null,
            shazhi_id: item.shazhi_id ? parseInt(item.shazhi_id) : null,
            price: item.price || 0,
            mianliao_bianhao: item.mianliao_bianhao || null,
          }));
        if (detailPayloads.length > 0) {
          const { error: detailError } = await supabase
            .from("order_sku_detail")
            .insert(detailPayloads);
          if (detailError) throw detailError;
        }
      }

      setShowCreateModal(false);
      await fetchOrders();
    } catch (error) {
      console.error("Create order error:", error);
      setErrorDialog({ open: true, message: "创建订单失败：" + (error as Error).message });
    }
  }

  async function handleCreateCustomer() {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) return;
    try {
      const { data, error } = await supabase
        .from("customer")
        .insert([{
          name: newCustomerForm.name,
          phone: newCustomerForm.phone,
          remark: newCustomerForm.remark || null,
          wedding_date: newCustomerForm.wedding_date || null,
          address: newCustomerForm.address || null,
        }])
        .select("id, name, phone");
      if (error) throw error;
      if (data && data.length > 0) {
        setCustomers((prev) => [...prev, ...data].sort((a, b) => a.name.localeCompare(b.name)));
        setCreateOrderForm((prev) => ({ ...prev, customer_id: String(data[0].id) }));
      }
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: "", phone: "", remark: "", wedding_date: "", address: "" });
    } catch (error) {
      console.error("Create customer error:", error);
      setErrorDialog({ open: true, message: "创建顾客失败：" + (error as Error).message });
    }
  }

  async function viewOrderDetail(order: Order) {
    setSelectedOrder(order);
    setDetailTab("details");
    setShowDetailModal(true);

    const [detailsRes, paymentsRes, progressRes] = await Promise.all([
      supabase.from("order_sku_detail").select("*").eq("order_id", order.id),
      supabase.from("order_payment").select("*").eq("order_id", order.id).order("date_created", { ascending: false }),
      supabase.from("order_progress").select("*").eq("order_id", order.id).order("date_created", { ascending: false }),
    ]);

    setOrderDetails(detailsRes.data || []);
    setOrderPayments(paymentsRes.data || []);
    setOrderProgresses(progressRes.data || []);
  }

  function openPaymentModal(order: Order) {
    setSelectedOrder(order);
    setPaymentForm({ price: "", show_counselor_name: "" });
    setShowPaymentModal(true);
  }

  async function handleAddPayment() {
    if (!selectedOrder || !paymentForm.price) return;
    try {
      const { error } = await supabase.from("order_payment").insert([
        {
          order_id: selectedOrder.id,
          price: parseFloat(paymentForm.price),
          show_counselor_name: paymentForm.show_counselor_name || null,
        },
      ]);
      if (error) throw error;
      setShowPaymentModal(false);
      if (showDetailModal) await viewOrderDetail(selectedOrder);
      await fetchOrders();
    } catch (error) {
      console.error("Add payment error:", error);
      setErrorDialog({ open: true, message: "添加收款失败：" + (error as Error).message });
    }
  }

  function getTotalPaid(): number {
    return orderPayments.reduce((sum, p) => sum + (p.price || 0), 0);
  }

  function formatDate(d: string | null): string {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("zh-CN");
  }

  function formatDateTime(d: string | null): string {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN");
  }

  function renderProgressSection(progress: OrderProgress) {
    const sections: { title: string; items: { label: string; value: string }[] }[] = [];

    const xizhuangItems: { label: string; value: string }[] = [];
    if (progress.xizhuang_mianliao) xizhuangItems.push({ label: "面料", value: progress.xizhuang_mianliao });
    if (progress.xizhuang_mianliao_bianhao) xizhuangItems.push({ label: "面料编号", value: progress.xizhuang_mianliao_bianhao });
    if (progress.xizhuang_changjia) xizhuangItems.push({ label: "厂家", value: progress.xizhuang_changjia });
    if (progress.xizhuang_xiadan_time) xizhuangItems.push({ label: "下单时间", value: formatDate(progress.xizhuang_xiadan_time) });
    if (progress.mianliao_price != null) xizhuangItems.push({ label: "面料价格", value: `¥${progress.mianliao_price}` });
    if (progress.mianliao_xiadan_time) xizhuangItems.push({ label: "面料下单时间", value: formatDateTime(progress.mianliao_xiadan_time) });
    if (progress.gongyi_price != null) xizhuangItems.push({ label: "工艺价格", value: `¥${progress.gongyi_price}` });
    if (progress.maopi_daohuo_time) xizhuangItems.push({ label: "毛皮到货", value: formatDate(progress.maopi_daohuo_time) });
    if (progress.maopi_daohuo_time2) xizhuangItems.push({ label: "毛皮到货2", value: formatDate(progress.maopi_daohuo_time2) });
    if (progress.fanchang_time) xizhuangItems.push({ label: "返厂时间", value: formatDate(progress.fanchang_time) });
    if (progress.chengyi_daohuo_time) xizhuangItems.push({ label: "成衣到货", value: formatDate(progress.chengyi_daohuo_time) });
    if (xizhuangItems.length > 0) sections.push({ title: "西装", items: xizhuangItems });

    const chenshanItems: { label: string; value: string }[] = [];
    if (progress.chenshan_mianliao_bianhao) chenshanItems.push({ label: "面料编号", value: progress.chenshan_mianliao_bianhao });
    if (progress.chenshan_mianliao_price != null) chenshanItems.push({ label: "面料价格", value: `¥${progress.chenshan_mianliao_price}` });
    if (progress.chenshan_changjia) chenshanItems.push({ label: "厂家", value: progress.chenshan_changjia });
    if (progress.chenshan_mianliao_xiadan_time) chenshanItems.push({ label: "面料下单时间", value: formatDate(progress.chenshan_mianliao_xiadan_time) });
    if (progress.chenshan_xiadan_time) chenshanItems.push({ label: "下单时间", value: formatDate(progress.chenshan_xiadan_time) });
    if (progress.chenshan_daohuo_time) chenshanItems.push({ label: "到货时间", value: formatDate(progress.chenshan_daohuo_time) });
    if (progress.chenshan_gongyi_price != null) chenshanItems.push({ label: "工艺价格", value: `¥${progress.chenshan_gongyi_price}` });
    if (chenshanItems.length > 0) sections.push({ title: "衬衫", items: chenshanItems });

    const peijianItems: { label: string; value: string }[] = [];
    if (progress.peijian_bianhao) peijianItems.push({ label: "编号", value: progress.peijian_bianhao });
    if (progress.peijian_price) peijianItems.push({ label: "价格", value: progress.peijian_price });
    if (progress.peijian_xiadan_time) peijianItems.push({ label: "下单时间", value: formatDate(progress.peijian_xiadan_time) });
    if (progress.peijian_daohuo_time) peijianItems.push({ label: "到货时间", value: formatDate(progress.peijian_daohuo_time) });
    if (peijianItems.length > 0) sections.push({ title: "配件", items: peijianItems });

    const quyiItems: { label: string; value: string }[] = [];
    if (progress.quyi_time) quyiItems.push({ label: "取衣时间", value: formatDateTime(progress.quyi_time) });
    if (progress.quyi_content) quyiItems.push({ label: "取衣内容", value: progress.quyi_content });
    if (quyiItems.length > 0) sections.push({ title: "取衣", items: quyiItems });

    if (progress.beizhu) sections.push({ title: "备注", items: [{ label: "", value: progress.beizhu }] });
    if (progress.guke_name) sections.push({ title: "顾客", items: [{ label: "姓名", value: progress.guke_name }] });

    if (sections.length === 0) return <p className="text-muted-foreground text-sm">暂无进度详情</p>;

    return (
      <div className="space-y-3">
        {sections.map((section, i) => (
          <div key={i} className="border rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{section.title}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {section.items.map((item, j) => (
                <div key={j} className={item.label ? "" : "col-span-2"}>
                  {item.label && <span className="text-xs text-muted-foreground">{item.label}: </span>}
                  <span className="text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
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
          <h1 className="text-2xl font-bold">订单管理</h1>
          <p className="text-muted-foreground">管理西装定制订单、收款和进度</p>
        </div>
        <Button onClick={openCreateOrderModal}>
          <Plus className="size-4 mr-2" />
          新建订单
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-sm text-muted-foreground">总订单数</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              ¥{orders.reduce((s, o) => s + (o.real_price || 0), 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">实付总金额</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              ¥{orders.reduce((s, o) => s + (o.total_price || 0), 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">原始总金额</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter((o) => {
                const d = new Date(o.date_created);
                const today = new Date();
                return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
              }).length}
            </div>
            <p className="text-sm text-muted-foreground">今日新增</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>订单列表</CardTitle>
              <CardDescription>共 {filteredOrders.length} 条订单</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索顾客、顾问..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">订单ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">顾客</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">顾问</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">原始金额</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">实付金额</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">支付方式</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">创建时间</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-4 px-4 font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="py-4 px-4 font-medium">{order.customer_name || "-"}</td>
                    <td className="py-4 px-4">{order.counselor_name || "-"}</td>
                    <td className="py-4 px-4">¥{order.total_price?.toFixed(2)}</td>
                    <td className="py-4 px-4 font-bold">¥{order.real_price?.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      {order.pay_type
                        ? PaymentMethodLabels[order.pay_type] || order.pay_type
                        : "-"}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(order.date_created).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewOrderDetail(order)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openPaymentModal(order)} title="添加收款">
                          <DollarSign className="size-4 text-green-600" />
                        </Button>
                        <Link to="/ficus/order-print" search={{ id: order.id }}>
                          <Button variant="ghost" size="sm" title="打印订单">
                            <Printer className="size-4 text-blue-600" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>订单ID: {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">顾客</p>
                  <p className="font-medium">{selectedOrder.customer_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">顾问</p>
                  <p className="font-medium">{selectedOrder.counselor_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">原始金额</p>
                  <p className="font-medium">¥{selectedOrder.total_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">实付金额</p>
                  <p className="font-bold text-lg">¥{selectedOrder.real_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">已收款</p>
                  <p className="font-medium text-green-600">¥{getTotalPaid().toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">待收款</p>
                  <p className="font-medium text-orange-600">
                    ¥{((selectedOrder.real_price || 0) - getTotalPaid()).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">支付方式</p>
                  <p className="font-medium">
                    {selectedOrder.pay_type ? PaymentMethodLabels[selectedOrder.pay_type] || selectedOrder.pay_type : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">创建时间</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.date_created)}</p>
                </div>
              </div>

              {selectedOrder.remark && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">备注</p>
                  <p className="text-sm">{selectedOrder.remark}</p>
                </div>
              )}

              <div className="flex gap-2 border-b pb-2">
                <Button
                  variant={detailTab === "details" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDetailTab("details")}
                >
                  <FileText className="size-4 mr-1" />
                  订单明细 ({orderDetails.length})
                </Button>
                <Button
                  variant={detailTab === "payments" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDetailTab("payments")}
                >
                  <CreditCard className="size-4 mr-1" />
                  收款记录 ({orderPayments.length})
                </Button>
                <Button
                  variant={detailTab === "progress" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDetailTab("progress")}
                >
                  <Clock className="size-4 mr-1" />
                  进度 ({orderProgresses.length})
                </Button>
              </div>

              {detailTab === "details" && (
                <div>
                  {orderDetails.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">暂无明细</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">产品</th>
                          <th className="text-left py-2 px-2">品类</th>
                          <th className="text-left py-2 px-2">颜色</th>
                          <th className="text-left py-2 px-2">纱织</th>
                          <th className="text-left py-2 px-2">金额</th>
                          <th className="text-left py-2 px-2">面料编号</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.map((d) => (
                          <tr key={d.id} className="border-b">
                            <td className="py-2 px-2">{getSkuName(d.sku_id)}</td>
                            <td className="py-2 px-2">{getClassifyName(d.classify_id)}</td>
                            <td className="py-2 px-2">{getColorName(d.color_id)}</td>
                            <td className="py-2 px-2">{getShazhiName(d.shazhi_id)}</td>
                            <td className="py-2 px-2 font-medium">¥{d.price?.toFixed(2)}</td>
                            <td className="py-2 px-2 text-muted-foreground">{d.mianliao_bianhao || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {detailTab === "payments" && (
                <div>
                  {orderPayments.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">暂无收款记录</p>
                  ) : (
                    <div className="space-y-2">
                      {orderPayments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium text-sm">
                              ¥{p.price?.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.show_counselor_name || "未知"} · {formatDateTime(p.date_created)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-2">
                        <p className="text-sm font-medium">
                          合计: <span className="text-green-600">¥{getTotalPaid().toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "progress" && (
                <div>
                  {orderProgresses.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">暂无进度记录</p>
                  ) : (
                    <div className="space-y-4">
                      {orderProgresses.map((p) => (
                        <div key={p.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              {p.guke_name || "未知顾客"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(p.date_created)}
                            </span>
                          </div>
                          {renderProgressSection(p)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Link
                  to="/ficus/order-print"
                  search={{ id: selectedOrder.id }}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <Printer className="size-4 mr-1" />
                    打印订单
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    openPaymentModal(selectedOrder);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <DollarSign className="size-4 mr-1" />
                  添加收款
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加收款</DialogTitle>
            <DialogDescription>订单: {selectedOrder?.customer_name} · ¥{selectedOrder?.real_price?.toFixed(2)}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>收款金额 *</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.price}
                onChange={(e) => setPaymentForm({ ...paymentForm, price: e.target.value })}
                placeholder="请输入金额"
              />
            </Field>
            <Field>
              <Label>收款人</Label>
              <Input
                value={paymentForm.show_counselor_name}
                onChange={(e) => setPaymentForm({ ...paymentForm, show_counselor_name: e.target.value })}
                placeholder="收款顾问姓名"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowPaymentModal(false)} variant="outline">
              取消
            </Button>
            <Button onClick={handleAddPayment} disabled={!paymentForm.price}>
              确认收款
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建订单</DialogTitle>
            <DialogDescription>创建新的西装定制订单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <div className="flex items-center justify-between">
                  <Label>顾客 *</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-primary text-xs"
                    onClick={() => {
                      setNewCustomerForm({ name: "", phone: "", remark: "", wedding_date: "", address: "" });
                      setShowAddCustomerModal(true);
                    }}
                  >
                    <UserPlus className="size-3 mr-1" />
                    新增顾客
                  </Button>
                </div>
                <select
                  value={createOrderForm.customer_id}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, customer_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">选择顾客</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <Label>顾问</Label>
                <select
                  value={createOrderForm.counselor_id}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, counselor_id: e.target.value })}
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
            </FieldGroup>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">产品列表</Label>
                <Button variant="outline" size="sm" onClick={addOrderItem}>
                  <Plus className="size-4 mr-1" />
                  添加产品
                </Button>
              </div>

              {orderItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无产品，点击"添加产品"开始
                </p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.key} className="border rounded-md p-3 space-y-2 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                        onClick={() => removeOrderItem(item.key)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">产品 *</label>
                          <select
                            value={item.sku_id}
                            onChange={(e) => updateOrderItem(item.key, "sku_id", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                          >
                            <option value="">选择产品</option>
                            {skusWithCode.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">品类 *</label>
                          <select
                            value={item.classify_id}
                            onChange={(e) => updateOrderItem(item.key, "classify_id", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                          >
                            <option value="">选择品类</option>
                            {classifies.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">颜色</label>
                          <select
                            value={item.color_id}
                            onChange={(e) => updateOrderItem(item.key, "color_id", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                          >
                            <option value="">选择颜色</option>
                            {colors.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">纱织</label>
                          <select
                            value={item.shazhi_id}
                            onChange={(e) => updateOrderItem(item.key, "shazhi_id", e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                          >
                            <option value="">选择纱织</option>
                            {shazhis.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">售价</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price || ""}
                            onChange={(e) => updateOrderItem(item.key, "price", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                            placeholder="自动读取"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">面料编号</label>
                          <Input
                            value={item.mianliao_bianhao}
                            onChange={(e) => updateOrderItem(item.key, "mianliao_bianhao", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="面料编号"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <p className="text-sm font-medium">
                      产品总价: <span className="text-lg text-primary">¥{calcTotalPrice().toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <FieldGroup>
              <Field>
                <Label>实付金额</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createOrderForm.real_price}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, real_price: e.target.value })}
                  placeholder={`留空则默认等于产品总价 ¥${calcTotalPrice().toFixed(2)}`}
                />
              </Field>
              <Field>
                <Label>支付方式</Label>
                <select
                  value={createOrderForm.pay_type}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, pay_type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">选择支付方式</option>
                  <option value="cash">现金</option>
                  <option value="wechat">微信</option>
                  <option value="alipay">支付宝</option>
                  <option value="card">银行卡</option>
                  <option value="other">其他</option>
                </select>
              </Field>
              <Field>
                <Label>备注</Label>
                <Input
                  value={createOrderForm.remark}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, remark: e.target.value })}
                  placeholder="可选备注"
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreateModal(false)} variant="outline">
              取消
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!createOrderForm.customer_id}
            >
              创建订单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddCustomerModal} onOpenChange={setShowAddCustomerModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增顾客</DialogTitle>
            <DialogDescription>创建新顾客后自动选入订单</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>姓名 *</Label>
              <Input
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                placeholder="请输入顾客姓名"
              />
            </Field>
            <Field>
              <Label>电话 *</Label>
              <Input
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </Field>
            <Field>
              <Label>婚期</Label>
              <Input
                type="date"
                value={newCustomerForm.wedding_date}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, wedding_date: e.target.value })}
              />
            </Field>
            <Field>
              <Label>地址</Label>
              <Input
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                placeholder="请输入地址"
              />
            </Field>
            <Field>
              <Label>备注</Label>
              <Input
                value={newCustomerForm.remark}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, remark: e.target.value })}
                placeholder="可选备注"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowAddCustomerModal(false)} variant="outline">
              取消
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()}
            >
              创建并选入
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
    </div>
  );
}

export const Route = createFileRoute("/ficus/orders")({
  component: FicusOrdersPage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
