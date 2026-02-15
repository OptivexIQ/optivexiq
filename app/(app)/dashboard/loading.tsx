import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-56" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-6 w-36 rounded-full" />
          <div className="hidden min-w-45 flex-col gap-1 sm:flex">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-1.5 w-44" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>
      <div className="flex-1 px-6 py-8">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    </div>
  );
}
