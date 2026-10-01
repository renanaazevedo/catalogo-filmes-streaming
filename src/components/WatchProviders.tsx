import Image from "next/image";
import type { RegionWatchInfo } from "@/lib/tmdb/details";
import { logoUrl } from "@/lib/tmdb/images";

export function WatchProviders({ info }: { info: RegionWatchInfo }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Onde assistir</h2>
      {info.providers.length === 0 ? (
        <p className="mt-2 text-neutral-400">Indisponível em streaming por assinatura neste país.</p>
      ) : (
        <>
          <ul className="mt-3 flex flex-wrap gap-3">
            {info.providers.map((p) => {
              const logo = logoUrl(p.logo_path);
              const content = logo ? (
                <Image src={logo} alt={p.provider_name} width={48} height={48} className="rounded-lg" />
              ) : (
                <span className="flex h-12 items-center rounded-lg bg-neutral-800 px-3 text-sm">
                  {p.provider_name}
                </span>
              );
              return (
                <li key={p.provider_id}>
                  {info.link ? (
                    <a href={info.link} target="_blank" rel="noopener noreferrer" title={p.provider_name}>
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">Dados de JustWatch</p>
        </>
      )}
    </section>
  );
}
