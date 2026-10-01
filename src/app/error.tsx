"use client";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-center">
      <p className="text-lg">Não foi possível carregar os filmes</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-700"
      >
        Tentar de novo
      </button>
    </main>
  );
}
