import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ receiptToken: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { receiptToken } = await context.params;

    if (!receiptToken) {
      return NextResponse.json(
        { error: "Receipt token is required" },
        { status: 400 }
      );
    }

    // Look up by receipt_token — the real order UUID never leaves the server
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, restaurant_locations(location_name)")
      .eq("receipt_token", receiptToken)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Calculate subtotal and tax from total
    const totalDollars = order.total_cents / 100;
    const TAX_RATE = 0.13; // 13% Ontario tax
    const subtotal = totalDollars / (1 + TAX_RATE);
    const tax = totalDollars - subtotal;

    return NextResponse.json({
      id: order.id,
      orderNumber: `ORD-${order.id.toString().slice(0, 8).toUpperCase()}`,
      date: new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      paymentMethod: "VISA",
      customerName: order.customer_name,
      customerEmail: order.customer_email || "N/A",
      customerPhone: order.customer_phone,
      billingAddress: order.billing_address || "N/A",
      billingCountry: order.billing_country || "N/A",
      items: order.items.map((item: { name: string; quantity: number; priceCents: number; image: string }) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.priceCents / 100,
        image_url: item.image || "",
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(totalDollars.toFixed(2)),
      status: order.status,
      pickupTime: order.pickup_time,
      locationName: (order.restaurant_locations as any)?.location_name
        ?.replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    console.error("Error fetching order by receipt token:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
