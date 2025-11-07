import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

export function ConversationSkeleton() {
  return (
    <div className="p-3 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}
