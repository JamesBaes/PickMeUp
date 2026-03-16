import { NextRequest, NextResponse } from "next/server";
import { getSquareClient } from "@/lib/square";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // `sourceId` is the Square tokenized card payload from the client.
    // `orderDetails` contains customer + order metadata used for DB persistence.
    const { sourceId, orderDetails } = await request.json();

    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: "Missing payment token" },
        { status: 400 }
      );
    }

    if (!orderDetails?.totalCents) {
      return NextResponse.json(
        { success: false, error: "Missing order details" },
        { status: 400 }
      );
    }

    // Initialize Square client lazily in server runtime.
    const { payments } = getSquareClient();

    // Charge the card token with an idempotency key to prevent accidental double-charges.
    const response = await payments.create({
    sourceId: sourceId,
    idempotencyKey: randomUUID(),
    amountMoney: {
        amount: BigInt(orderDetails.totalCents),
        currency: "CAD",
    },
    });

    // Debug: log the response structure
    console.log("Square response:", JSON.stringify(response, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

    // SDK versions can shape responses differently, normalize to `payment`.
    const payment = response.payment || response;

    if (!payment?.id) {
    return NextResponse.json(
        { success: false, error: "Payment failed - no payment ID returned" },
        { status: 400 }
    );
    }

    // Generate a public-safe receipt token. This avoids exposing internal order IDs
    // in client-facing routes or URLs.
    const receiptToken = randomUUID();

    // Persist paid order for post-checkout pages, order history, and receipts.
    const { data: order, error: dbError } = await supabase
    .from("orders")
    .insert({
        customer_name: orderDetails.customerName,
        customer_email: orderDetails.customerEmail,
        customer_phone: orderDetails.customerPhone,
        billing_address: orderDetails.billingAddress,
        billing_country: orderDetails.billingCountry,
        items: orderDetails.items,
        total_cents: orderDetails.totalCents,
        square_payment_id: payment.id,
        status: "paid",
        pickup_time: orderDetails.pickupTime || new Date(Date.now() + 30 * 60000).toISOString(),
        receipt_token: receiptToken,
        restaurant_id: orderDetails.restaurantId,
    })
    .select()
    .single();

    if (dbError) {
    console.error("Supabase error:", dbError);
    return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
    );
    }

    return NextResponse.json({
    success: true,
    orderId: order.id,
    receiptToken: receiptToken,
    paymentId: payment.id,
    });

  } catch (error: any) {
    console.error("Payment error:", error);

    // Square SDK errors come back as structured `errors[]` in many cases.
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.detail || "Square payment failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Payment failed" },
      { status: 500 }
    );
  }
}