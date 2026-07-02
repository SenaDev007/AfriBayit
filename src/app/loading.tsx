// AfriBayit — Global Loading State (P3.3)
// Branded loading skeleton shown during Suspense boundaries

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-[#003366] via-[#3399FF] to-[#FFCC00]" />

      {/* Header skeleton */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Skeleton className="h-10 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>

      {/* Hero skeleton */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6 mx-auto" />
          <div className="flex gap-4 justify-center pt-4">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="bg-[#003366] px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Skeleton className="h-6 w-24 bg-white/20" />
          <Skeleton className="h-4 w-32 bg-white/10" />
        </div>
      </footer>
    </div>
  );
}
