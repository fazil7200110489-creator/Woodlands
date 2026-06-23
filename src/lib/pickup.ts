export function generatePickupSlots(now = new Date()): string[] {
  const slots: string[] = [];
  const interval = 15;
  const prepBufferMins = 20;
  const start = new Date(now.getTime() + prepBufferMins * 60000);
  const rounded = new Date(start);
  const mins = rounded.getMinutes();
  rounded.setMinutes(Math.ceil(mins / interval) * interval, 0, 0);

  for (let i = 0; i < 16; i++) {
    const slot = new Date(rounded.getTime() + i * interval * 60000);
    const label = slot.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    slots.push(label);
  }
  return slots;
}

export function toCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
