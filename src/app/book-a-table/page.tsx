"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Calendar, Clock, Users, Mail, Phone, User, MessageSquare, GlassWater } from "lucide-react";
import MagneticButton from "@/components/MagneticButton";

const occasions = [
  "None",
  "Birthday",
  "Anniversary",
  "Business Meeting",
  "Family Dinner",
  "Other"
];

// Generate simple time slots for the evening
const timeSlots = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function BookTablePage() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    date: "",
    timeSlot: "",
    guests: 2,
    specialOccasion: "None",
    specialInstructions: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book table");
      }

      // Save to local history
      try {
        const history = JSON.parse(localStorage.getItem("woodlands_reservations") || "[]");
        history.unshift(data);
        localStorage.setItem("woodlands_reservations", JSON.stringify(history));
      } catch (err) {}

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today) in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF8F3] text-[#1D0F07]">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#BF976A]/14 bg-[#FBF8F3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link href="/" className="flex items-center gap-2 font-display text-2xl leading-none text-[#1D0F07] transition-opacity hover:opacity-75">
            <span className="text-[#BF976A] text-lg leading-none">◆</span> Woodlands
          </Link>
          <div className="flex items-center gap-6 font-mono-num text-[10px] uppercase tracking-[0.28em]">
            <Link href="/" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">Back to Menu</Link>
          </div>
        </div>
      </nav>

      {/* Hero & Form Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-24 pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_62%_42%,rgba(191,151,106,0.13)_0%,transparent_65%)]" />
        
        <div className="relative z-10 w-full max-w-[1000px]">
          <div className="mb-12 text-center">
            <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="section-label mb-5">
              Premium Dining
            </m.p>
            <m.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.1 }} className="font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.9] text-[#1D0F07]">
              Reserve your<br /><em className="not-italic text-[#BF976A]">Table.</em>
            </m.h1>
            <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.2 }} className="mx-auto mt-6 max-w-[400px] font-serif text-[1.05rem] leading-[1.85] text-[#5C4A38]">
              Experience our signature flavors in an elegant setting. Secure your spot for an unforgettable evening.
            </m.p>
          </div>

          <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.3 }} className="mx-auto max-w-[700px] rounded-[32px] border border-[#BF976A]/20 bg-white/70 p-6 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.07)] backdrop-blur-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center font-serif text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* Guest Details */}
                <div className="space-y-6">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                    <input required type="text" placeholder="Full Name" className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                    <input required type="tel" placeholder="Mobile Number" className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                    <input type="email" placeholder="Email Address (Optional)" className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="space-y-6">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                    <input required type="date" min={today} className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <select required className="w-full appearance-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.timeSlot} onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}>
                        <option value="" disabled>Time</option>
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <select required className="w-full appearance-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.guests} onChange={e => setFormData({ ...formData, guests: Number(e.target.value) })}>
                        <option value="" disabled>Guests</option>
                        {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1} {i===0 ? 'Guest' : 'Guests'}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <GlassWater className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                    <select className="w-full appearance-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.specialOccasion} onChange={e => setFormData({ ...formData, specialOccasion: e.target.value })}>
                      <option value="None" disabled>Occasion (Optional)</option>
                      {occasions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="relative">
                <MessageSquare className="absolute left-4 top-6 h-5 w-5 text-[#9B7340]/60" />
                <textarea placeholder="Special Instructions (Dietary requirements, seating preference, etc.)" rows={3} className="w-full resize-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white" value={formData.specialInstructions} onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })} />
              </div>

              <MagneticButton disabled={isSubmitting} className="mx-auto w-full max-w-sm rounded-full bg-[#1D0F07] py-5 font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:opacity-50">
                {isSubmitting ? "Confirming..." : "Confirm Reservation"}
              </MagneticButton>
            </form>
          </m.div>
        </div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {successData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1D0F07]/40 backdrop-blur-sm" onClick={() => setSuccessData(null)} />
            <m.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] bg-white p-10 text-center shadow-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#BF976A]/10 text-[#BF976A]">
                <Calendar size={32} />
              </div>
              <h2 className="mb-2 font-display text-4xl text-[#1D0F07]">Confirmed!</h2>
              <p className="font-serif text-[#5C4A38]">Your table has been reserved.</p>
              
              <div className="my-8 rounded-2xl border border-[#BF976A]/20 bg-[#FBF8F3] p-6 text-left">
                <div className="mb-4 border-b border-[#BF976A]/10 pb-4">
                  <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">Reference ID</p>
                  <p className="font-mono-num text-xl text-[#1D0F07]">{successData.referenceId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">Date & Time</p>
                    <p className="font-serif text-sm text-[#1D0F07]">{successData.date} at {successData.timeSlot}</p>
                  </div>
                  <div>
                    <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">Guests</p>
                    <p className="font-serif text-sm text-[#1D0F07]">{successData.guests} People</p>
                  </div>
                </div>
              </div>

              <Link href="/">
                <MagneticButton className="w-full rounded-full bg-[#1D0F07] py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#FBF8F3] hover:bg-[#BF976A] hover:text-[#1D0F07]">
                  Back to Home
                </MagneticButton>
              </Link>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
