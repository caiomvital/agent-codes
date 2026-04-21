/** Shared skeleton used by all dashboard loading.tsx files */
export function SkeletonRelatorio() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-gray-200" />
        <div className="h-4 w-40 rounded bg-gray-100" />
      </div>

      {/* Score + modules row */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-gray-200" />
        <div className="space-y-4">
          <div className="h-20 rounded-xl bg-gray-200" />
          <div className="h-20 rounded-xl bg-gray-200" />
          <div className="h-20 rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* Strengths + problems */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-2xl bg-gray-200" />
        <div className="h-48 rounded-2xl bg-gray-200" />
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        <div className="h-9 w-32 rounded-lg bg-gray-200" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-gray-200" />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-200" />
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-200" />
        <div className="h-10 w-28 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
