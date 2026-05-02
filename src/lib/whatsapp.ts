import { toCurrency } from "@/lib/pickup";

type WAOrder = {
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  pickupTime: string;
};

export function buildOrderMessage(order: WAOrder) {
  const items = order.items
    .map((i) => `${i.name} x${i.qty} - ${toCurrency(i.price * i.qty)}`)
    .join("\n");
  return `Order placed.\n\nItems:\n${items}\n\nTotal Amount: ${toCurrency(order.totalAmount)}\nPickup Time: ${order.pickupTime}\n\nPlease confirm my order.`;
}

export function buildWhatsAppRedirect(message: string, to = "7200110489") {
  return `https://wa.me/91${to}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppCloudMessage(message: string) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.OWNER_PHONE || "917200110489";
  if (!token || !phoneNumberId) return { skipped: true };

  const res = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });
  if (!res.ok) throw new Error("WhatsApp Cloud API failed");
  return res.json();
}
