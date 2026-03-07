export function BoardGridSkeleton() {
  return (
    <div className="space-y-10">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-border-primary bg-bg-secondary p-8 sm:p-12">
        <div className="skeleton h-10 w-32 rounded-lg" />
        <div className="skeleton mt-3 h-5 w-72 max-w-full rounded" />
        <div className="mt-6 flex items-center gap-4">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
      </div>

      {/* Category skeletons */}
      {[1, 2, 3].map((cat) => (
        <div key={cat} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-6 w-28 rounded" />
            <div className="skeleton h-5 w-8 rounded-full" />
            <div className="h-px flex-1 bg-border-primary" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <div
                key={card}
                className="rounded-xl border border-border-primary bg-bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="skeleton h-9 w-12 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="skeleton mt-1.5 h-3 w-full rounded" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="skeleton h-4 w-14 rounded" />
                  <div className="skeleton h-4 w-10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoardCatalogSkeleton() {
  return (
    <div className="space-y-6">
      {/* Board header skeleton */}
      <div className="rounded-2xl border border-border-primary bg-bg-secondary p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-14 w-14 rounded-xl" />
          <div>
            <div className="skeleton h-7 w-40 rounded" />
            <div className="skeleton mt-2 h-4 w-64 rounded" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="skeleton h-10 flex-1 min-w-[200px] rounded-lg" />
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-10 w-20 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border-primary bg-bg-card"
          >
            <div className="skeleton aspect-[4/3] w-full" />
            <div className="p-2">
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton mt-1 h-3 w-full rounded" />
              <div className="skeleton mt-1 h-2.5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThreadSkeleton() {
  return (
    <div className="space-y-4">
      {/* Thread header skeleton */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary p-4">
        <div className="skeleton h-8 w-16 rounded-lg" />
        <div className="skeleton h-6 w-48 rounded" />
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="skeleton h-10 w-full rounded-lg" />

      {/* Post skeletons */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((post) => (
          <div
            key={post}
            className="rounded-xl border border-border-primary bg-bg-card"
          >
            {/* Post header */}
            <div className="flex items-center gap-2 border-b border-border-primary/40 px-4 py-2.5">
              {post === 1 && <div className="skeleton h-5 w-8 rounded" />}
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            {/* Post body */}
            <div className="px-4 py-3">
              {post === 1 && (
                <div className="mb-3 flex gap-2">
                  <div className="skeleton h-[150px] w-[150px] rounded-lg" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-full rounded" />
                <div className="skeleton h-3.5 w-5/6 rounded" />
                <div className="skeleton h-3.5 w-4/6 rounded" />
              </div>
            </div>
            {/* Post footer */}
            <div className="flex items-center gap-3 border-t border-border-primary/20 px-4 py-2">
              <div className="skeleton h-5 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
