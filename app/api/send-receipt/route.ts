import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
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
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #e63946;
              margin: 0;
            }
            .section {
              background-color: #fff;
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .section h2 {
              color: #333;
              border-bottom: 2px solid #e63946;
              padding-bottom: 10px;
              margin-top: 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 1.2em;
              font-weight: bold;
              border-top: 2px solid #333;
              margin-top: 10px;
            }
            .pickup-time {
              background-color: #e63946;
              color: white;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              font-size: 1.3em;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 0.9em;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍔 Gladiator Burger</h1>
            <p>Order Confirmation</p>
          </div>

          <div class="pickup-time">
            Pick Up Time: ${pickupTime}
          </div>

          <div class="section">
            <h2>Order Summary</h2>
            <div class="info-row">
              <span class="info-label">Order Number:</span>
              <span>${orderData.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${orderData.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span>${orderData.paymentMethod}</span>
            </div>
          </div>

          <div class="section">
            <h2>Your Items</h2>
            ${orderData.items
              .map(
                (item: any) => `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong>
                  <br />
                  <small>Quantity: ${item.quantity}</small>
                </div>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `
              )
              .join("")}

            <div class="info-row" style="margin-top: 15px;">
              <span class="info-label">Subtotal:</span>
              <span>$${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tax:</span>
              <span>$${orderData.tax.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Order Total:</span>
              <span>$${orderData.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Billing Information</h2>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span>${orderData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${orderData.customerEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${orderData.customerPhone}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span>${orderData.billingAddress}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your order!</p>
            <p>We'll notify you when your order is ready for pickup.</p>
            <p style="margin-top: 20px; color: #999; font-size: 0.8em;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: "Gladiator Burger <onboarding@resend.dev>", // You'll need to update this with your verified domain
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
