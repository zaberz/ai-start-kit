import { createFileRoute, redirect } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Palette,
  Tag,
  Package,
  DollarSign,
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

type TabType = "sku" | "classify" | "color" | "shazhi";

interface SkuItem {
  id: number;
  name: string;
  remark: string | null;
  archived: boolean;
  sort: number | null;
  date_created: string;
}

interface ClassifyItem {
  id: number;
  name: string;
  sort: number | null;
}

interface TagItem {
  id: number;
  name: string;
  sort: number | null;
  archived: boolean;
}

interface SkuClassifyPrice {
  id: number;
  sku_id: number;
  classify_id: number;
  price: number;
}

function FicusProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sku");
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [classifies, setClassifies] = useState<ClassifyItem[]>([]);
  const [colors, setColors] = useState<TagItem[]>([]);
  const [shazhis, setShazhis] = useState<TagItem[]>([]);
  const [prices, setPrices] = useState<SkuClassifyPrice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showSkuModal, setShowSkuModal] = useState(false);
  const [editingSku, setEditingSku] = useState<SkuItem | null>(null);
  const [skuForm, setSkuForm] = useState({ name: "", remark: "", sort: "" });

  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [editingClassify, setEditingClassify] = useState<ClassifyItem | null>(null);
  const [classifyForm, setClassifyForm] = useState({ name: "", sort: "" });

  const [showTagModal, setShowTagModal] = useState(false);
  const [tagType, setTagType] = useState<"color" | "shazhi">("color");
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagForm, setTagForm] = useState({ name: "", sort: "" });

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceForm, setPriceForm] = useState({ sku: "", classify: "", price: "" });

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
      const [skuRes, classifyRes, colorRes, shazhiRes, priceRes] = await Promise.all([
        supabase.from("sku").select("*").order("sort"),
        supabase.from("classify").select("*").order("sort"),
        supabase.from("tag_color").select("*").order("sort"),
        supabase.from("tag_shazhi").select("*").order("sort"),
        supabase.from("sku_classify_price").select("*"),
      ]);

      setSkus(skuRes.data || []);
      setClassifies(classifyRes.data || []);
      setColors(colorRes.data || []);
      setShazhis(shazhiRes.data || []);
      setPrices(priceRes.data || []);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getSkuPrice(skuId: number): string {
    const skuPrices = prices.filter((p) => p.sku_id === skuId);
    if (skuPrices.length === 0) return "未定价";
    return skuPrices.map((p) => {
      const cls = classifies.find((c) => c.id === p.classify_id);
      return `${cls?.name || "未知"}: ¥${p.price}`;
    }).join(" / ");
  }

  function openCreateSku() {
    setEditingSku(null);
    setSkuForm({ name: "", remark: "", sort: "" });
    setShowSkuModal(true);
  }

  function openEditSku(sku: SkuItem) {
    setEditingSku(sku);
    setSkuForm({
      name: sku.name,
      remark: sku.remark || "",
      sort: sku.sort ? String(sku.sort) : "",
    });
    setShowSkuModal(true);
  }

  async function handleSaveSku() {
    if (!skuForm.name.trim()) return;
    try {
      const payload = {
        name: skuForm.name,
        remark: skuForm.remark || null,
        sort: skuForm.sort ? parseInt(skuForm.sort) : null,
      };
      if (editingSku) {
        const { error } = await supabase.from("sku").update(payload).eq("id", editingSku.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sku").insert([payload]);
        if (error) throw error;
      }
      setShowSkuModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Save SKU error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
    }
  }

  function requestDeleteSku(sku: SkuItem) {
    setConfirmDialog({
      open: true,
      title: "删除产品",
      description: `确定删除产品「${sku.name}」吗？此操作不可撤销。`,
      onConfirm: () => performDeleteSku(sku),
    });
  }

  async function performDeleteSku(sku: SkuItem) {
    try {
      const { error } = await supabase.from("sku").delete().eq("id", sku.id);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error("Delete SKU error:", error);
      setErrorDialog({ open: true, message: "删除失败：" + (error as Error).message });
    }
  }

  function openCreateClassify() {
    setEditingClassify(null);
    setClassifyForm({ name: "", sort: "" });
    setShowClassifyModal(true);
  }

  function openEditClassify(cls: ClassifyItem) {
    setEditingClassify(cls);
    setClassifyForm({ name: cls.name, sort: cls.sort ? String(cls.sort) : "" });
    setShowClassifyModal(true);
  }

  async function handleSaveClassify() {
    if (!classifyForm.name.trim()) return;
    try {
      const payload = {
        name: classifyForm.name,
        sort: classifyForm.sort ? parseInt(classifyForm.sort) : null,
      };
      if (editingClassify) {
        const { error } = await supabase.from("classify").update(payload).eq("id", editingClassify.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classify").insert([payload]);
        if (error) throw error;
      }
      setShowClassifyModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Save classify error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
    }
  }

  function requestDeleteClassify(cls: ClassifyItem) {
    setConfirmDialog({
      open: true,
      title: "删除品类",
      description: `确定删除品类「${cls.name}」吗？此操作不可撤销。`,
      onConfirm: () => performDeleteClassify(cls),
    });
  }

  async function performDeleteClassify(cls: ClassifyItem) {
    try {
      const { error } = await supabase.from("classify").delete().eq("id", cls.id);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error("Delete classify error:", error);
      setErrorDialog({ open: true, message: "删除失败：" + (error as Error).message });
    }
  }

  function openCreateTag(type: "color" | "shazhi") {
    setTagType(type);
    setEditingTag(null);
    setTagForm({ name: "", sort: "" });
    setShowTagModal(true);
  }

  function openEditTag(type: "color" | "shazhi", tag: TagItem) {
    setTagType(type);
    setEditingTag(tag);
    setTagForm({ name: tag.name, sort: tag.sort ? String(tag.sort) : "" });
    setShowTagModal(true);
  }

  async function handleSaveTag() {
    if (!tagForm.name.trim()) return;
    const tableName = tagType === "color" ? "tag_color" : "tag_shazhi";
    try {
      const payload = {
        name: tagForm.name,
        sort: tagForm.sort ? parseInt(tagForm.sort) : null,
      };
      if (editingTag) {
        const { error } = await supabase.from(tableName).update(payload).eq("id", editingTag.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert([payload]);
        if (error) throw error;
      }
      setShowTagModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Save tag error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
    }
  }

  function requestDeleteTag(type: "color" | "shazhi", tag: TagItem) {
    const label = type === "color" ? "颜色" : "纱织";
    setConfirmDialog({
      open: true,
      title: `删除${label}`,
      description: `确定删除${label}「${tag.name}」吗？此操作不可撤销。`,
      onConfirm: () => performDeleteTag(type, tag),
    });
  }

  async function performDeleteTag(type: "color" | "shazhi", tag: TagItem) {
    const tableName = type === "color" ? "tag_color" : "tag_shazhi";
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", tag.id);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error("Delete tag error:", error);
      setErrorDialog({ open: true, message: "删除失败：" + (error as Error).message });
    }
  }

  function openCreatePrice() {
    setPriceForm({ sku: "", classify: "", price: "" });
    setShowPriceModal(true);
  }

  async function handleSavePrice() {
    if (!priceForm.sku || !priceForm.classify || !priceForm.price) return;
    try {
      const { error } = await supabase.from("sku_classify_price").insert([
        {
          sku_id: parseInt(priceForm.sku),
          classify_id: parseInt(priceForm.classify),
          price: parseFloat(priceForm.price),
        },
      ]);
      if (error) throw error;
      setShowPriceModal(false);
      await fetchAllData();
    } catch (error) {
      console.error("Save price error:", error);
      setErrorDialog({ open: true, message: "保存失败：" + (error as Error).message });
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

  const tabs: { key: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { key: "sku", label: "产品", icon: Package, count: skus.length },
    { key: "classify", label: "品类", icon: Tag, count: classifies.length },
    { key: "color", label: "颜色", icon: Palette, count: colors.length },
    { key: "shazhi", label: "纱织", icon: Tag, count: shazhis.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">产品管理</h1>
          <p className="text-muted-foreground">管理产品、品类、颜色和纱织标签</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "sku" && (
            <>
              <Button onClick={openCreateSku}>
                <Plus className="size-4 mr-2" />
                新增产品
              </Button>
              <Button variant="outline" onClick={openCreatePrice}>
                <DollarSign className="size-4 mr-2" />
                设置价格
              </Button>
            </>
          )}
          {activeTab === "classify" && (
            <Button onClick={openCreateClassify}>
              <Plus className="size-4 mr-2" />
              新增品类
            </Button>
          )}
          {activeTab === "color" && (
            <Button onClick={() => openCreateTag("color")}>
              <Plus className="size-4 mr-2" />
              新增颜色
            </Button>
          )}
          {activeTab === "shazhi" && (
            <Button onClick={() => openCreateTag("shazhi")}>
              <Plus className="size-4 mr-2" />
              新增纱织
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="size-4 mr-1" />
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {activeTab === "sku" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>产品列表</CardTitle>
                <CardDescription>共 {skus.length} 个产品</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="搜索产品..."
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">名称</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">价格</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">备注</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {skus
                    .filter((s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((sku) => (
                      <tr key={sku.id} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-4 font-medium">{sku.name}</td>
                        <td className="py-4 px-4 text-sm">{getSkuPrice(sku.id)}</td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{sku.remark || "-"}</td>
                        <td className="py-4 px-4">
                          {sku.archived ? (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">已归档</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">在售</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditSku(sku)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => requestDeleteSku(sku)} className="text-red-600">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "classify" && (
        <Card>
          <CardHeader>
            <CardTitle>品类列表</CardTitle>
            <CardDescription>共 {classifies.length} 个品类</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {classifies.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">排序: {cls.sort ?? "-"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditClassify(cls)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => requestDeleteClassify(cls)} className="text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "color" && (
        <Card>
          <CardHeader>
            <CardTitle>颜色标签</CardTitle>
            <CardDescription>共 {colors.length} 个颜色</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {colors.map((color) => (
                <div key={color.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                    <span className="font-medium">{color.name}</span>
                    {color.archived && <span className="text-xs text-muted-foreground">(已归档)</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditTag("color", color)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => requestDeleteTag("color", color)} className="text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "shazhi" && (
        <Card>
          <CardHeader>
            <CardTitle>纱织标签</CardTitle>
            <CardDescription>共 {shazhis.length} 个纱织</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {shazhis.map((sz) => (
                <div key={sz.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <span className="font-medium">{sz.name}</span>
                    {sz.archived && <span className="text-xs text-muted-foreground ml-2">(已归档)</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditTag("shazhi", sz)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => requestDeleteTag("shazhi", sz)} className="text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showSkuModal} onOpenChange={setShowSkuModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSku ? "编辑产品" : "新增产品"}</DialogTitle>
            <DialogDescription>
              {editingSku ? "修改产品信息" : "填写信息创建新产品"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>产品名称 *</Label>
              <Input value={skuForm.name} onChange={(e) => setSkuForm({ ...skuForm, name: e.target.value })} placeholder="请输入产品名称" />
            </Field>
            <Field>
              <Label>排序</Label>
              <Input type="number" value={skuForm.sort} onChange={(e) => setSkuForm({ ...skuForm, sort: e.target.value })} placeholder="排序值" />
            </Field>
            <Field>
              <Label>备注</Label>
              <Input value={skuForm.remark} onChange={(e) => setSkuForm({ ...skuForm, remark: e.target.value })} placeholder="可选备注" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowSkuModal(false)} variant="outline">取消</Button>
            <Button onClick={handleSaveSku} disabled={!skuForm.name.trim()}>
              {editingSku ? "保存修改" : "创建产品"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClassifyModal} onOpenChange={setShowClassifyModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingClassify ? "编辑品类" : "新增品类"}</DialogTitle>
            <DialogDescription>
              {editingClassify ? "修改品类信息" : "填写信息创建新品类"}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>品类名称 *</Label>
              <Input value={classifyForm.name} onChange={(e) => setClassifyForm({ ...classifyForm, name: e.target.value })} placeholder="如：西装、衬衫、领带" />
            </Field>
            <Field>
              <Label>排序</Label>
              <Input type="number" value={classifyForm.sort} onChange={(e) => setClassifyForm({ ...classifyForm, sort: e.target.value })} placeholder="排序值" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowClassifyModal(false)} variant="outline">取消</Button>
            <Button onClick={handleSaveClassify} disabled={!classifyForm.name.trim()}>
              {editingClassify ? "保存修改" : "创建品类"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTag ? `编辑${tagType === "color" ? "颜色" : "纱织"}` : `新增${tagType === "color" ? "颜色" : "纱织"}`}</DialogTitle>
            <DialogDescription>
              {editingTag ? `修改${tagType === "color" ? "颜色" : "纱织"}信息` : `填写信息创建新${tagType === "color" ? "颜色" : "纱织"}`}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>名称 *</Label>
              <Input value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} placeholder={`请输入${tagType === "color" ? "颜色" : "纱织"}名称`} />
            </Field>
            <Field>
              <Label>排序</Label>
              <Input type="number" value={tagForm.sort} onChange={(e) => setTagForm({ ...tagForm, sort: e.target.value })} placeholder="排序值" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowTagModal(false)} variant="outline">取消</Button>
            <Button onClick={handleSaveTag} disabled={!tagForm.name.trim()}>
              {editingTag ? "保存修改" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>设置价格</DialogTitle>
            <DialogDescription>为产品和品类组合设置价格</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label>产品 *</Label>
              <select value={priceForm.sku} onChange={(e) => setPriceForm({ ...priceForm, sku: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">选择产品</option>
                {skus.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>品类 *</Label>
              <select value={priceForm.classify} onChange={(e) => setPriceForm({ ...priceForm, classify: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">选择品类</option>
                {classifies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>价格 *</Label>
              <Input type="number" step="0.01" value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} placeholder="请输入价格" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button onClick={() => setShowPriceModal(false)} variant="outline">取消</Button>
            <Button onClick={handleSavePrice} disabled={!priceForm.sku || !priceForm.classify || !priceForm.price}>
              保存价格
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

export const Route = createFileRoute("/ficus/products")({
  component: FicusProductsPage,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
