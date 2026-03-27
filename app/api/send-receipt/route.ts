import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { orderId, orderData } = await request.json();

    if (!orderData || !orderData.customerEmail) {
      return NextResponse.json(
        { error: "Missing order data or email" },
        { status: 400 }
      );
    }

    // Format pickup time
    const pickupTime = new Date(orderData.pickupTime).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    );

    // Generate HTML email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            body {
              font-family: 'DM Sans', Arial, sans-serif;
              background-color: #F9FAFB;
              color: #111827;
              margin: 0;
              padding: 0;
            }
            .wrapper {
              max-width: 580px;
              margin: 40px auto;
              padding: 0 16px 40px;
            }
            .brand {
              text-align: center;
              padding: 32px 0 24px;
            }
            .brand h1 {
              font-size: 24px;
              font-weight: 700;
              color: #B6244F;
              margin: 0 0 4px;
              letter-spacing: -0.3px;
            }
            .brand p {
              font-size: 14px;
              color: #4B5563;
              margin: 0;
            }
            .pickup-banner {
              background-color: #B6244F;
              color: #ffffff;
              border-radius: 10px;
              padding: 18px 24px;
              text-align: center;
              margin-bottom: 20px;
            }
            .pickup-banner .label {
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              opacity: 0.85;
              margin-bottom: 4px;
            }
            .pickup-banner .time {
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .card {
              background-color: #ffffff;
              border: 1px solid #E5E7EB;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 16px;
            }
            .card-title {
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.07em;
              text-transform: uppercase;
              color: #4B5563;
              margin: 0 0 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid #E5E7EB;
            }
            .row {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              padding: 8px 0;
              border-bottom: 1px solid #F3F4F6;
              font-size: 14px;
            }
            .row:last-child {
              border-bottom: none;
            }
            .row .label {
              color: #4B5563;
            }
            .row .value {
              color: #111827;
              font-weight: 500;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              padding: 10px 0;
              border-bottom: 1px solid #F3F4F6;
              font-size: 14px;
            }
            .item-row:last-of-type {
              border-bottom: none;
            }
            .item-name {
              font-weight: 600;
              color: #111827;
            }
            .item-qty {
              font-size: 12px;
              color: #6B7280;
              margin-top: 2px;
            }
            .item-price {
              color: #111827;
              font-weight: 500;
            }
            .totals {
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid #E5E7EB;
            }
            .total-final {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: 700;
              color: #111827;
              padding-top: 12px;
              margin-top: 8px;
              border-top: 2px solid #111827;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #9CA3AF;
              margin-top: 32px;
              line-height: 1.6;
            }
            .footer a {
              color: #B6244F;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">

            <div class="brand">
              <h1>Gladiator Burger</h1>
              <p>Order Confirmation</p>
            </div>

            <div class="pickup-banner">
              <div class="label">Estimated Pick Up</div>
              <div class="time">${pickupTime}</div>
            </div>

            <!-- Order Details -->
            <div class="card">
              <div class="card-title">Order Details</div>
              <div class="row">
                <span class="label">Order ID:</span>
                <span class="value">${orderData.id}</span>
              </div>
              <div class="row">
                <span class="label">Date:</span>
                <span class="value">${orderData.date}</span>
              </div>
              <div class="row">
                <span class="label">Payment:</span>
                <span class="value">${orderData.paymentMethod}</span>
              </div>
            </div>

            <!-- Items -->
            <div class="card">
              <div class="card-title">Your Items</div>
              ${orderData.items
                .map(
                  (item: any) => `
                <div class="item-row">
                  <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-qty">Qty: ${item.quantity}</div>
                  </div>
                  <span class="item-price">: $${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
              <div class="totals">
                <div class="row">
                  <span class="label">Subtotal:</span>
                  <span class="value">$${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div class="row">
                  <span class="label">Tax:</span>
                  <span class="value">$${orderData.tax.toFixed(2)}</span>
                </div>
                <div class="total-final">
                  <span>Order Total:</span>
                  <span>$${orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Billing -->
            <div class="card">
              <div class="card-title">Billing Information</div>
              <div class="row">
                <span class="label">Name:</span>
                <span class="value">${orderData.customerName}</span>
              </div>
              <div class="row">
                <span class="label">Email:</span>
                <span class="value">${orderData.customerEmail}</span>
              </div>
              <div class="row">
                <span class="label">Phone:</span>
                <span class="value">${orderData.customerPhone}</span>
              </div>
              <div class="row">
                <span class="label">Address:</span>
                <span class="value">${orderData.billingAddress}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your order. We'll have it ready for you soon.</p>
              <p style="margin-top: 8px; color: #D1D5DB;">This is an automated email — please do not reply.</p>
            </div>

          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: "Gladiator Burger <mail@pickmeup.fit>", 
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: emailHtml,
    });

    if (emailError) {
      throw new Error(emailError.message);
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
