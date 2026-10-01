import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Em cartaz no streaming",
  description: "Filmes disponíveis agora nos streamings por assinatura.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
        <footer className="mx-auto mt-12 flex max-w-7xl items-center gap-3 border-t border-neutral-800 px-4 py-6 text-xs text-neutral-500">
          <Image src="/tmdb-logo.svg" alt="TMDB" width={92} height={12} unoptimized />
          <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
        </footer>
      </body>
    </html>
  );
}
