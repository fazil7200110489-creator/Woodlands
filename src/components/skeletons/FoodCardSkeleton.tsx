export function FoodCardSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[320px] rounded-[4px] border border-white/10"
          style={{
            background: "#111",
            animation: "shimmer 1.5s infinite",
            backgroundImage: "linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)",
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
}
