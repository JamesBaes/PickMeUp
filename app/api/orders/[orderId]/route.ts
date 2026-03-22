import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // In App Router route handlers, dynamic params are resolved asynchronously.
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch canonical order record.
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, restaurant_locations(location_name)")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Derive subtotal/tax display values from stored total.
    const totalDollars = order.total_cents / 100;
    const TAX_RATE = 0.13; // 13% Ontario tax
    const subtotal = totalDollars / (1 + TAX_RATE);
    const tax = totalDollars - subtotal;

    // Normalize API response to a frontend-friendly shape.
    const formattedOrder = {
      id: order.id,
      orderNumber: `ORD-${order.id.toString().slice(0, 8).toUpperCase()}`,
      date: new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      paymentMethod: "VISA", // Default to VISA, you can enhance this later
      customerName: order.customer_name,
      customerEmail: order.customer_email || "N/A",
      customerPhone: order.customer_phone,
      billingAddress: order.billing_address || "N/A",
      billingCountry: order.billing_country || "N/A",
      items: order.items.map((item: any) => ({
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
    };

    return NextResponse.json(formattedOrder);
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}
