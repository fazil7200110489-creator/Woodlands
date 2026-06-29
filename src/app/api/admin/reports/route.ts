import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel, ReservationModel } from "@/lib/models";
import { requireAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "daily"; // daily, weekly, monthly, yearly
    const format = url.searchParams.get("format") || "csv";  // csv, pdf

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (range === "weekly") {
      startDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Fetch all records within range
    const orders = await OrderModel.find({
      createdAt: { $gte: startDate },
      status: { $ne: "Cancelled" },
      paymentStatus: "Paid",
    }).lean();

    const reservations = await ReservationModel.find({
      createdAt: { $gte: startDate },
      status: { $in: ["Confirmed", "Completed"] },
      paymentStatus: "Paid",
    }).lean();

    const totalOrdersRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalReservationsRev = reservations.reduce((sum, r) => sum + (r.paymentAmount || 0), 0);
    const netRevenue = totalOrdersRev + totalReservationsRev;

    // ── CSV EXPORT FORMAT ──────────────────────────────────────────────────
    if (format === "csv") {
      let csvContent = "";
      
      // Document metadata
      csvContent += `Woodlands Grill House - POS Report (${range.toUpperCase()})\n`;
      csvContent += `Generated On: ${now.toLocaleString()}\n`;
      csvContent += `Total Orders Revenue: Rs. ${totalOrdersRev}\n`;
      csvContent += `Total Reservations Revenue: Rs. ${totalReservationsRev}\n`;
      csvContent += `Total Combined Revenue: Rs. ${netRevenue}\n\n`;
      
      // Orders breakdown header
      csvContent += "ORDERS BREAKDOWN\n";
      csvContent += "Order ID,Customer Name,Phone,Total Amount,Pickup Time,Date Placed\n";
      
      orders.forEach((o: any) => {
        csvContent += `"${o._id}","${o.customerName}","${o.customerPhone}",${o.totalAmount},"${o.pickupTime}","${new Date(o.createdAt).toLocaleDateString()}"\n`;
      });
      
      csvContent += "\nRESERVATIONS BREAKDOWN\n";
      csvContent += "Reference ID,Customer Name,Phone,Email,Guests,Table,Date,Time Slot,Advance Paid\n";
      
      reservations.forEach((r: any) => {
        csvContent += `"${r.referenceId}","${r.customerName}","${r.customerPhone}","${r.customerEmail || ""}",${r.guests},"${r.tableNumber}","${r.date}","${r.timeSlot}",${r.paymentAmount}\n`;
      });

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="woodlands_${range}_report_${now.toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // ── PDF PRINT PREVIEW FORMAT (Returns responsive printer-ready HTML page) ──
    if (format === "pdf") {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Woodlands POS Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1D0F07; padding: 40px; background: #FFF; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #BF976A; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; }
            .meta { display: flex; justify-content: space-between; font-size: 13px; color: #5C4A38; margin-top: 10px; }
            .stats-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 1px solid rgba(191,151,106,0.3); padding: 20px; border-radius: 12px; text-align: center; }
            .stat-val { font-size: 24px; font-weight: bold; color: #BF976A; margin-top: 5px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #EAEAEA; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th, td { border-bottom: 1px solid #EAEAEA; padding: 10px 8px; text-align: left; }
            th { background: #FBF8F3; font-weight: bold; }
            .print-btn { background: #BF976A; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 20px; cursor: pointer; display: block; margin: 0 auto 30px; }
            @media print { .print-btn { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          
          <div class="header">
            <div class="logo">◆ Woodlands Grill House</div>
            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.15em; color: #9B7340; margin-top: 5px;">
              POS Financial Report (${range})
            </div>
            <div class="meta">
              <span>Date Generated: ${now.toLocaleString()}</span>
              <span>Report Coverage: Since ${startDate.toLocaleDateString()}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div>Total Orders</div>
              <div class="stat-val">${orders.length}</div>
            </div>
            <div class="stat-card">
              <div>Total Bookings</div>
              <div class="stat-val">${reservations.length}</div>
            </div>
            <div class="stat-card">
              <div>Net Combined Revenue</div>
              <div class="stat-val">₹${netRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div class="section-title">Paid Orders (${orders.length})</div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Pickup Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><code>#${o._id.toString().slice(-6).toUpperCase()}</code></td>
                  <td>${o.customerName}</td>
                  <td>${o.customerPhone}</td>
                  <td>₹${o.totalAmount}</td>
                  <td>${o.pickupTime}</td>
                  <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Table Reservations (${reservations.length})</div>
          <table>
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Guests</th>
                <th>Table</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Advance</th>
              </tr>
            </thead>
            <tbody>
              ${reservations.map(r => `
                <tr>
                  <td><code>${r.referenceId}</code></td>
                  <td>${r.customerName}</td>
                  <td>${r.customerPhone}</td>
                  <td>${r.guests} People</td>
                  <td>Table ${r.tableNumber}</td>
                  <td>${r.date}</td>
                  <td>${r.timeSlot}</td>
                  <td>₹${r.paymentAmount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (err: any) {
    console.error("[GET /api/admin/reports]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
