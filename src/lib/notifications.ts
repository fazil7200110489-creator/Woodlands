import "server-only";
import nodemailer from "nodemailer";
import { type BookingDetails, buildWhatsAppShareUrl } from "./notifications-shared";

export { type BookingDetails, buildWhatsAppShareUrl };

// ─── Email ──────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.log("[notifications] SMTP not configured, skipping email.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Woodlands Grill House" <${from}>`,
      to,
      subject,
      html,
    });

    console.log(`[notifications] Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error("[notifications] Email failed:", err);
    return false;
  }
}

function buildConfirmationEmailHtml(booking: BookingDetails): string {
  return `
    <div style="max-width:520px;margin:0 auto;font-family:'Georgia',serif;color:#1D0F07;background:#FBF8F3;padding:40px 32px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="color:#BF976A;font-size:24px;">◆</span>
        <h1 style="font-size:28px;margin:8px 0 4px;color:#1D0F07;">Booking Confirmed!</h1>
        <p style="color:#5C4A38;font-size:14px;">Your table has been reserved at Woodlands Grill House.</p>
      </div>

      <div style="background:#fff;border:1px solid rgba(191,151,106,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="border-bottom:1px solid rgba(191,151,106,0.15);padding-bottom:16px;margin-bottom:16px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9B7340;margin:0 0 4px;">Booking Reference</p>
          <p style="font-size:22px;font-family:monospace;color:#1D0F07;margin:0;font-weight:bold;">${booking.referenceId}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;vertical-align:top;">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9B7340;margin:0 0 2px;">Table</p>
              <p style="font-size:14px;color:#1D0F07;margin:0;">${booking.tableLabel}</p>
            </td>
            <td style="padding:8px 0;vertical-align:top;">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9B7340;margin:0 0 2px;">Guests</p>
              <p style="font-size:14px;color:#1D0F07;margin:0;">${booking.guests} People</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;vertical-align:top;">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9B7340;margin:0 0 2px;">Date</p>
              <p style="font-size:14px;color:#1D0F07;margin:0;">${booking.date}</p>
            </td>
            <td style="padding:8px 0;vertical-align:top;">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9B7340;margin:0 0 2px;">Time</p>
              <p style="font-size:14px;color:#1D0F07;margin:0;">${booking.timeSlot}</p>
            </td>
          </tr>
        </table>

        ${booking.paymentId ? `
        <div style="border-top:1px solid rgba(191,151,106,0.15);padding-top:16px;margin-top:16px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9B7340;margin:0 0 4px;">Payment</p>
          <p style="font-size:12px;color:#2ECC71;margin:0;">₹${booking.paymentAmount} advance paid ✓</p>
        </div>` : ""}
      </div>

      <div style="background:rgba(191,151,106,0.08);border:1px solid rgba(191,151,106,0.15);border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="font-size:12px;color:#5C4A38;margin:0;line-height:1.6;">
          <strong>Manage your booking:</strong> Visit our website and go to "Manage Booking" to view, modify, or cancel your reservation using your Booking Reference and Mobile Number.
        </p>
      </div>

      <p style="text-align:center;font-size:11px;color:#9B7340;">
        Woodlands Grill House · Premium Dining<br/>
        Thank you for choosing us!
      </p>
    </div>
  `;
}

function buildCancellationEmailHtml(booking: BookingDetails & { refundAmount: number; refundId?: string }): string {
  return `
    <div style="max-width:520px;margin:0 auto;font-family:'Georgia',serif;color:#1D0F07;background:#FBF8F3;padding:40px 32px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="color:#BF976A;font-size:24px;">◆</span>
        <h1 style="font-size:28px;margin:8px 0 4px;color:#1D0F07;">Booking Cancelled</h1>
        <p style="color:#5C4A38;font-size:14px;">Your reservation has been cancelled.</p>
      </div>

      <div style="background:#fff;border:1px solid rgba(191,151,106,0.2);border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="border-bottom:1px solid rgba(191,151,106,0.15);padding-bottom:16px;margin-bottom:16px;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9B7340;margin:0 0 4px;">Booking Reference</p>
          <p style="font-size:22px;font-family:monospace;color:#1D0F07;margin:0;font-weight:bold;">${booking.referenceId}</p>
        </div>
        <p style="font-size:14px;color:#5C4A38;margin:0 0 8px;">
          <strong>Table:</strong> ${booking.tableLabel} · <strong>Date:</strong> ${booking.date} at ${booking.timeSlot}
        </p>
        ${booking.refundAmount > 0 ? `
        <div style="border-top:1px solid rgba(191,151,106,0.15);padding-top:16px;margin-top:16px;">
          <p style="font-size:14px;color:#2ECC71;margin:0;">
            Refund of ₹${booking.refundAmount} has been initiated.${booking.refundId ? ` Refund ID: ${booking.refundId}` : ""}
          </p>
          <p style="font-size:12px;color:#9B7340;margin:4px 0 0;">Refunds typically take 5–7 business days to process.</p>
        </div>` : `
        <div style="border-top:1px solid rgba(191,151,106,0.15);padding-top:16px;margin-top:16px;">
          <p style="font-size:14px;color:#E74C3C;margin:0;">No refund applicable for this cancellation.</p>
        </div>`}
      </div>

      <p style="text-align:center;font-size:11px;color:#9B7340;">
        Woodlands Grill House · Premium Dining
      </p>
    </div>
  `;
}

// ─── WhatsApp ───────────────────────────────────────────────────────────

function buildBookingWhatsAppMessage(booking: BookingDetails): string {
  return [
    `✅ *Booking Confirmed — Woodlands*`,
    ``,
    `📋 *Ref:* ${booking.referenceId}`,
    `👤 *Name:* ${booking.customerName}`,
    `🪑 *Table:* ${booking.tableLabel}`,
    `📅 *Date:* ${booking.date}`,
    `🕐 *Time:* ${booking.timeSlot}`,
    `👥 *Guests:* ${booking.guests}`,
    booking.paymentAmount ? `💰 *Advance:* ₹${booking.paymentAmount} paid` : ``,
    ``,
    `Manage your booking at: ${process.env.APP_BASE_URL || "http://localhost:3000"}/manage-booking?ref=${encodeURIComponent(booking.referenceId)}`,
  ].filter(Boolean).join("\n");
}

async function sendWhatsAppNotification(message: string, to?: string): Promise<boolean> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = to || process.env.OWNER_PHONE || "917200110489";

  if (!token || !phoneNumberId) {
    console.log("[notifications] WhatsApp not configured, skipping.");
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) throw new Error(`WhatsApp API returned ${res.status}`);
    console.log(`[notifications] WhatsApp sent to ${recipient}`);
    return true;
  } catch (err) {
    console.error("[notifications] WhatsApp failed:", err);
    return false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

export async function sendBookingConfirmation(booking: BookingDetails): Promise<{
  emailSent: boolean;
  whatsappSent: boolean;
}> {
  const results = { emailSent: false, whatsappSent: false };

  // Email to customer
  if (booking.customerEmail) {
    results.emailSent = await sendEmail(
      booking.customerEmail,
      `Booking Confirmed — ${booking.referenceId} | Woodlands`,
      buildConfirmationEmailHtml(booking)
    );
  }

  // WhatsApp to restaurant owner (optional)
  const waMessage = buildBookingWhatsAppMessage(booking);
  results.whatsappSent = await sendWhatsAppNotification(waMessage);

  return results;
}

export async function sendCancellationNotification(
  booking: BookingDetails & { refundAmount: number; refundId?: string }
): Promise<{ emailSent: boolean }> {
  const results = { emailSent: false };

  if (booking.customerEmail) {
    results.emailSent = await sendEmail(
      booking.customerEmail,
      `Booking Cancelled — ${booking.referenceId} | Woodlands`,
      buildCancellationEmailHtml(booking)
    );
  }

  return results;
}
