"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Star,
  MessageSquare,
  Search,
  CheckCircle,
  XCircle,
  EyeOff,
  Eye,
  Trash2,
  CornerDownRight,
  RotateCw,
} from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Reply Overlay State
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reviews?search=${encodeURIComponent(search)}&page=${page}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.pages || 1);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Real-time SSE updates
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/orders/events");

      es.addEventListener("new_review", () => {
        fetchReviews();
      });

      es.onerror = () => {
        es.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [fetchReviews]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Approved" ? "Hidden" : "Approved";
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;

    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${replyTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === replyTarget._id ? { ...r, replyText } : r
          )
        );
        setReplyTarget(null);
        setReplyText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">Customer Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Moderate dining experience feedback, reply to customers, or hide reviews.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-1.5 text-xs text-[#9B7340] border border-[#BF976A]/30 bg-white hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors font-mono-num font-semibold uppercase tracking-wider"
        >
          <RotateCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Review breakdown metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Rating Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <span className="text-gray-500 text-sm font-medium">Average Rating</span>
          <div className="text-5xl font-bold text-gray-900 font-display mt-2">
            {stats.averageRating}
          </div>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                fill={i < Math.round(stats.averageRating) ? "#BF976A" : "none"}
                className="text-[#BF976A]"
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 mt-2">
            Based on {stats.totalReviews} reviews
          </span>
        </div>

        {/* Breakdown bar details */}
        <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-2.5">
          <RatingBar label="5 Stars" count={stats.fiveStar} total={stats.totalReviews} />
          <RatingBar label="4 Stars" count={stats.fourStar} total={stats.totalReviews} />
          <RatingBar label="3 Stars" count={stats.threeStar} total={stats.totalReviews} />
          <RatingBar label="2 Stars" count={stats.twoStar} total={stats.totalReviews} />
          <RatingBar label="1 Star" count={stats.oneStar} total={stats.totalReviews} />
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search reviews or customers…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm bg-white focus:border-[#BF976A] focus:outline-none focus:ring-2 focus:ring-[#BF976A]/10"
        />
      </div>

      {/* Reviews feed */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 animate-pulse h-32" />
          ))
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center border border-gray-100 text-gray-400 font-serif">
            No reviews match the current query.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r._id}
              className={`rounded-2xl bg-white p-6 shadow-sm border transition-all ${
                r.status === "Hidden" ? "border-gray-200 opacity-60 bg-gray-50/55" : "border-gray-100 hover:shadow-md"
              }`}
            >
              {/* Review card header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{r.customerName}</span>
                    <span className="text-xs font-mono text-gray-400">{r.customerPhone}</span>
                  </div>
                  {/* Rating stars */}
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < r.rating ? "#BF976A" : "none"}
                        className="text-[#BF976A]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(r._id, r.status)}
                    className={`flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1.5 transition-colors font-medium ${
                      r.status === "Approved"
                        ? "text-gray-500 hover:text-amber-600 border-gray-200 hover:bg-amber-50/50"
                        : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    {r.status === "Approved" ? <EyeOff size={13} /> : <Eye size={13} />}
                    {r.status === "Approved" ? "Hide" : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      setReplyTarget(r);
                      setReplyText(r.replyText || "");
                    }}
                    className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 hover:text-[#BF976A] hover:bg-[#BF976A]/5 transition-colors font-medium"
                  >
                    <MessageSquare size={13} />
                    {r.replyText ? "Edit Reply" : "Reply"}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(r._id)}
                    className="p-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Review Text */}
              <p className="mt-3.5 font-serif text-sm text-[#1D0F07] leading-relaxed">
                {r.reviewText || <span className="text-gray-400 italic">No text review.</span>}
              </p>

              {/* Context metadata */}
              <div className="flex flex-wrap gap-2 items-center mt-4 pt-3.5 border-t border-gray-50 text-[10px] text-gray-400 font-mono-num uppercase tracking-wider">
                <span>Placed: {new Date(r.createdAt).toLocaleDateString()}</span>
                {r.orderId && (
                  <>
                    <span>·</span>
                    <span className="bg-[#BF976A]/5 border border-[#BF976A]/15 text-[#9B7340] px-1.5 py-0.5 rounded">
                      Order: #{r.orderId.slice(-6).toUpperCase()}
                    </span>
                  </>
                )}
                {r.reservationId && (
                  <>
                    <span>·</span>
                    <span className="bg-purple-50 border border-purple-200 text-purple-700 px-1.5 py-0.5 rounded">
                      Booking Slot Table {r.tableNumber}
                    </span>
                  </>
                )}
                {r.foodOrdered?.length > 0 && (
                  <>
                    <span>·</span>
                    <span>Items: {r.foodOrdered.join(", ")}</span>
                  </>
                )}
              </div>

              {/* Reply Section */}
              {r.replyText && (
                <div className="mt-4 flex gap-2 rounded-xl bg-gray-50 p-4 border border-gray-100 text-sm">
                  <CornerDownRight className="text-gray-400 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">Woodlands Manager Reply</p>
                    <p className="font-serif text-[#5C4A38] leading-relaxed">{r.replyText}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D0F07]/35 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reply to Review</h3>
            <p className="text-xs text-gray-500 mb-4 font-serif leading-relaxed">
              Replying to <strong>{replyTarget.customerName}</strong>'s review rating of{" "}
              <strong>{replyTarget.rating} Stars</strong>.
            </p>
            <form onSubmit={handleReplySubmit} className="space-y-4">
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here..."
                required
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[#BF976A] focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replySubmitting}
                  className="rounded-xl bg-[#1D0F07] hover:bg-[#BF976A] hover:text-[#1D0F07] text-white px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-50 transition-colors"
                >
                  {replySubmitting ? "Sending..." : "Submit Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 text-xs font-mono">
      <span className="w-16 text-gray-500 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#BF976A]" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right text-gray-900 font-semibold">{count}</span>
      <span className="w-12 text-right text-gray-400 font-mono-num">{percent}%</span>
    </div>
  );
}
