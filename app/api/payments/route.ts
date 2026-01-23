import { NextRequest, NextResponse } from "next/server";
import { paymentsApi } from "@/lib/square";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // service role key bypasses RLS -> runs on the server and need access to db to insert orders
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // extract data from the frontend payment form
    const { sourceId, orderDetails } = await request.json();

    // 1. Create payment with Square
    const { result } = await paymentsApi.createPayment({ // pull the result object from squares response
      sourceId: sourceId,
      idempotencyKey: randomUUID(), // a unique ID for the specific transaction. fail safe if something goes wrong.
      amountMoney: {
        amount: BigInt(orderDetails.totalCents),
        currency: "CAD",
      },
    });

    if (!result.payment?.id) {
      throw new Error("Payment failed - no payment ID returned");
    }

    // 2. Save order to Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: orderDetails.customerName,
        customer_phone: orderDetails.customerPhone,
        items: orderDetails.items,
        total_cents: orderDetails.totalCents,
        square_payment_id: result.payment.id,
        status: "paid",
        pickup_time: orderDetails.pickupTime,
      })
      .select()
      .single();

    if (error) throw error;

    // if successful, send back a JSON response with the orderID to redirect to order confirmation page with paymentID and orderID
    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentId: result.payment.id,
    });

  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment failed" },
      { status: 400 }
    );
  }
}