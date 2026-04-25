export function FeaturedSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden px-4 md:px-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[260px] w-[300px] shrink-0 border border-white/10 bg-[#101010] skeleton-dark" />
      ))}
    </div>
  );
}
