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

    // Get Square client (initialized on demand)
    const { payments } = getSquareClient();

        // Create payment with Square
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

    // In v44, the response might be the payment directly
    const payment = response.payment || response;

    if (!payment?.id) {
    return NextResponse.json(
        { success: false, error: "Payment failed - no payment ID returned" },
        { status: 400 }
    );
    }

    // Generate a receipt token — separate from the DB primary key so the real
    // order UUID never needs to leave the server.
    const receiptToken = randomUUID();

    // Save order to Supabase
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