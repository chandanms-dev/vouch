import { Skeleton } from "@/components/ui/primitives";

/** Same footprint as VouchCard so the page does not jump when content arrives. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-card bg-surface p-4 ${className ?? ""}`}>
      <div className="flex justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-14 w-14 !rounded-2xl" />
      </div>
      <Skeleton className="mt-3 h-6 w-3/5" />
      <Skeleton className="mt-3 h-3 w-2/5" />
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-3 h-3 w-4/5" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

/** Mirrors the show detail layout: field header on mobile, side panel + two columns on desktop. */
export function ShowSkeleton({ back }: { back: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Loading show">
      <div className="md:hidden">
        <div className="px-4 pt-6">{back}</div>
        <section className="mt-4 rounded-b-[32px] bg-surface px-6 pb-8 pt-6">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="mt-3 h-9 w-3/4" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-5 h-14 w-48" />
        </section>
        <div className="space-y-4 px-4 pt-8">
          <Skeleton className="h-8 w-40" />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
      <div className="mx-auto hidden max-w-[1200px] px-10 pt-10 md:block">
        {back}
        <div className="mt-6 grid grid-cols-[400px_1fr] items-start gap-10">
          <section className="rounded-[32px] bg-surface p-8">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mt-4 h-14 w-3/4" />
            <Skeleton className="mt-4 h-4 w-1/2" />
            <Skeleton className="mt-14 h-4 w-24" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
            <Skeleton className="mt-8 h-14 w-48" />
            <Skeleton className="mt-5 h-[52px] w-full" />
          </section>
          <div>
            <Skeleton className="h-9 w-48" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <Skeleton className="mt-12 h-9 w-56" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors the profile layout: avatar + name, taste tags, vouch cards. */
export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile">
      <div className="mt-6 flex items-center gap-4">
        <Skeleton className="h-[72px] w-[72px]" />
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      </div>
      <Skeleton className="mt-8 h-7 w-40" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
      <Skeleton className="mt-8 h-7 w-28" />
      <div className="mt-4 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
