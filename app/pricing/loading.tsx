import { Skeleton } from "@/components/ui/skeleton"

export default function PricingLoading() {
  return (
    <div className="min-h-[100svh] bg-gray-950 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-4 w-24 mx-auto bg-gray-800" />
          <Skeleton className="h-10 w-80 mx-auto bg-gray-800" />
          <Skeleton className="h-5 w-64 mx-auto bg-gray-800" />
        </div>

        {/* Cost breakdown skeleton */}
        <div className="max-w-sm mx-auto mb-12">
          <div className="rounded-lg border border-gray-800 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full bg-gray-800" />
            ))}
          </div>
        </div>

        {/* Plan cards skeleton */}
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 p-6 space-y-4">
              <Skeleton className="h-7 w-20 bg-gray-800" />
              <Skeleton className="h-10 w-28 bg-gray-800" />
              <Skeleton className="h-4 w-full bg-gray-800" />
              <div className="space-y-2 pt-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-3/4 bg-gray-800" />
                ))}
              </div>
              <Skeleton className="h-12 w-full bg-gray-800 mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
