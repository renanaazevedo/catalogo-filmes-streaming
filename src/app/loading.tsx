export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-neutral-800" />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[2/3] animate-pulse rounded-lg bg-neutral-800" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
          </li>
        ))}
      </ul>
    </main>
  );
}
