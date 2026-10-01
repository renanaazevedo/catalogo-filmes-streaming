export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6" aria-busy="true">
      <div className="h-4 w-20 animate-pulse rounded bg-neutral-800" />
      <div className="mt-4 flex flex-col gap-6 md:flex-row">
        <div className="aspect-[2/3] w-48 animate-pulse rounded-lg bg-neutral-800" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-800" />
          <div className="h-24 w-full animate-pulse rounded bg-neutral-800" />
        </div>
      </div>
    </main>
  );
}
