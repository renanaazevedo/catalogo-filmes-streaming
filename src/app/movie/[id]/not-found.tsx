import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Filme não encontrado</h1>
      <Link href="/" className="mt-4 inline-block underline hover:text-white">
        ← Voltar
      </Link>
    </main>
  );
}
