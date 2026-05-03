import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import orderBgPng from "@/assets/order-bg.png";

interface SkuItem {
  id: number;
  name: string;
  code: string | null;
}

interface ClassifyItem {
  id: number;
  name: string;
}

interface OrderSkuDetail {
  id: number;
  order_id: string;
  sku_id: number | null;
  classify_id: number | null;
  price: number | null;
}

interface OrderPayment {
  id: number;
  order_id: string;
  price: number | null;
}

interface CustomerInfo {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  wedding_date: string | null;
}

interface CounselorInfo {
  id: string;
  name: string | null;
}

interface OrderData {
  id: string;
  real_price: number;
  total_price: number;
  customer_id: number | null;
  customer_name: string | null;
  user_id: string | null;
  counselor_name: string | null;
  remark: string | null;
  date_updated: string | null;
  date_created: string;
  advancePrice: number;
  customer?: CustomerInfo;
  counselor?: CounselorInfo;
  order_sku_detail: (OrderSkuDetail & { sku?: SkuItem; classify?: ClassifyItem })[];
}

function OrderPrintPage() {
  const search = Route.useSearch();
  const orderId = search.id;
  const printFormId = "print-form";

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!orderData) return;
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [orderData]);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  async function fetchOrderData() {
    try {
      const { data: orderInfo, error: orderError } = await supabase
        .from("order")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderInfo) return;

      const [customerRes, counselorRes, detailsRes, paymentsRes, skusRes, classifiesRes] =
        await Promise.all([
          supabase.from("customer").select("*").eq("id", orderInfo.customer_id).single(),
          supabase.from("profiles").select("id, name").eq("id", orderInfo.user_id).single(),
          supabase.from("order_sku_detail").select("*").eq("order_id", orderInfo.id),
          supabase.from("order_payment").select("*").eq("order_id", orderInfo.id),
          supabase.from("sku").select("id, name, code"),
          supabase.from("classify").select("id, name"),
        ]);

      const customer: CustomerInfo | undefined = customerRes.data
        ? {
            id: customerRes.data.id,
            name: customerRes.data.name,
            phone: customerRes.data.phone,
            address: customerRes.data.address,
            wedding_date: customerRes.data.wedding_date,
          }
        : undefined;

      const counselor: CounselorInfo | undefined = counselorRes.data
        ? { id: counselorRes.data.id, name: counselorRes.data.name }
        : undefined;

      const skus: SkuItem[] = skusRes.data || [];
      const classifies: ClassifyItem[] = classifiesRes.data || [];

      const orderSkuDetails: OrderData["order_sku_detail"] = (detailsRes.data || []).map(
        (detail: OrderSkuDetail) => ({
          ...detail,
          sku: skus.find((s) => s.id === detail.sku_id),
          classify: classifies.find((c) => c.id === detail.classify_id),
        })
      );

      let advancePrice = 0;
      (paymentsRes.data || []).forEach((payment: OrderPayment) => {
        advancePrice += payment.price || 0;
      });

      setOrderData({
        ...orderInfo,
        advancePrice,
        customer,
        counselor,
        order_sku_detail: orderSkuDetails,
      });
    } catch (error) {
      console.error("Fetch order data error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function savePDF() {
    setTimeout(() => {
      const element = document.getElementById(printFormId);
      if (!element) return;

      html2canvas(element).then((canvas) => {
        const a4Width = 595.28;

        const options = { scale: 1 };
        const canvasWidth = canvas.width / options.scale;
        const canvasHeight = canvas.height / options.scale;

        const pageWidth = a4Width;
        const pageHeight = (a4Width / canvasWidth) * canvasHeight;

        const doc = new jsPDF("p", "pt", "a4");
        doc.addImage(canvas.toDataURL("image/jpeg", 1), "JPEG", 0, 0, pageWidth, pageHeight);

        doc.save(`西装消费结算单-${orderData?.id}.pdf`);
      });
    }, 100);
  }

  function printNow() {
    const element = document.getElementById(printFormId);
    if (!element) return;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("id", "print-iframe");
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow!.document;
    const resetCss = document.createElement("style");
    iframe.contentDocument!.head.appendChild(resetCss);

    doc.write(`<body>
<style>
*{margin: 0;padding:0} body{
--container-width: 100vw;
}
@page {
            size: A4;
            margin: 0;
            padding: 0;
        }
        @media print {
  body {
    height: 297mm * 2;
    overflow: hidden;
  }
            .page-break {
                page-break-before: always;
                break-before: page;
            }
            .force-page-break {
                page-break-after: always;
                break-after: page;
                height: 0;
                visibility: hidden;
            }
        }
        .hetong-img{
        display: block !important;
        }
</style>
${element.innerHTML}
</body>`);

    doc.close();
    iframe.contentWindow!.focus();
    (iframe as HTMLIFrameElement).style.visibility = "hidden";

    setTimeout(() => {
      iframe.contentWindow!.print();
    }, 1000);

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 3000);
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

  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">未找到订单数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={savePDF}>下载PDF</Button>
        <Button onClick={printNow} variant="outline">直接打印</Button>
      </div>

      <div
        ref={containerRef}
        style={{
          overflow: "hidden",
          background: "#fff",
          color: "#000",
          maxWidth: "1000px",
          ["--container-width" as string]: `${containerWidth}px`,
        }}
      >
        <div
          id={printFormId}
          style={{
            position: "relative",
            background: "#fff",
            width: "100%",
          }}
        >
          <div style={{ position: "relative",overflow: 'hidden', fontSize: `calc(var(--container-width) * 0.012)` }}>
            <img
              src={orderBgPng}
              alt=""
              style={{
                position: "relative",
                marginTop: `calc(var(--container-width) * 0.0403)`,
                width: "100%",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.2857)`,
                left: `calc(var(--container-width) * 0.1261)`,
              }}
            >
              {orderData.id}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.3454)`,
                left: `calc(var(--container-width) * 0.1463)`,
              }}
            >
              {orderData.customer?.name || orderData.customer_name}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.3454)`,
                left: `calc(var(--container-width) * 0.4513)`,
              }}
            >
              {orderData.customer?.phone}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.3454)`,
                left: `calc(var(--container-width) * 0.7731)`,
                whiteSpace: "nowrap",
              }}
            >
              {orderData.date_updated
                ? format(new Date(orderData.date_updated), "yyyy-MM-dd HH:mm")
                : ""}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.3882)`,
                left: `calc(var(--container-width) * 0.1471)`,
              }}
            >
              {orderData.customer?.address}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.3882)`,
                left: `calc(var(--container-width) * 0.7462)`,
                whiteSpace: "nowrap",
              }}
            >
              {orderData.customer?.wedding_date
                ? format(new Date(orderData.customer.wedding_date), "yyyy-MM-dd")
                : ""}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.8487)`,
                left: `calc(var(--container-width) * 0.7983)`,
              }}
            >
              {orderData.real_price}(<s>{orderData.total_price}</s>)
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.8899)`,
                left: `calc(var(--container-width) * 0.7983)`,
              }}
            >
              {orderData.advancePrice}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.9311)`,
                left: `calc(var(--container-width) * 0.7983)`,
              }}
            >
              {orderData.real_price - orderData.advancePrice}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.9706)`,
                left: `calc(var(--container-width) * 0.1807)`,
              }}
            >
              {orderData.remark}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 1.1118)`,
                left: `calc(var(--container-width) * 0.2261)`,
              }}
            >
              {orderData.counselor?.name || orderData.counselor_name}
            </div>

            <div
              style={{
                position: "absolute",
                top: `calc(var(--container-width) * 0.5059)`,
                left: `calc(var(--container-width) * 0.0487)`,
              }}
            >
              {orderData.order_sku_detail.map((item) => (
                <div key={item.id} style={{ display: "flex" }}>
                  <div style={{ width: `calc(var(--container-width) * 0.3)` }}>
                    {item.sku?.name}
                    {item.classify?.name}
                  </div>
                  <div style={{ width: `calc(var(--container-width) * 0.3891)` }}>
                    {item.sku?.code}
                  </div>
                  <div style={{ width: `calc(var(--container-width) * 0.1101)` }}>1</div>
                  <div
                    style={{
                      width: `calc(var(--container-width) * 0.1025)`,
                      textAlign: "right",
                    }}
                  >
                    {item.price}{" "}
                    <span style={{ width: `calc(var(--container-width) * 0.0168)` }}></span>
                    RMB
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/ficus/order-print")({
  component: OrderPrintPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({ to: "/login" });
    }
  },
});
