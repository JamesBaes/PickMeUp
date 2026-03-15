import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order from Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
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

    // Calculate subtotal and tax from total
    const totalDollars = order.total_cents / 100;
    const TAX_RATE = 0.13; // 13% Ontario tax
    const subtotal = totalDollars / (1 + TAX_RATE);
    const tax = totalDollars - subtotal;

    // Format the order data for the frontend
    const formattedOrder = {
      id: order.id,
      orderNumber: `ORD-${order.id.toString().padStart(8, "0")}`,
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
