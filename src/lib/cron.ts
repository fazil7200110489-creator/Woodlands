import cron from "node-cron";

let started = false;

export function startCronJobs() {
  if (started || process.env.NODE_ENV === "test") return;
  started = true;

  cron.schedule("30 23 * * *", async () => {
    try {
      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/reports/daily`, { method: "POST" });
    } catch (e) {
      console.error("Daily report failed", e);
    }
  });
}
