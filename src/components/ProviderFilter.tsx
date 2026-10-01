import Image from "next/image";
import Link from "next/link";
import { buildHomeHref, type HomeParams } from "@/lib/search-params";
import { logoUrl } from "@/lib/tmdb/images";
import type { Provider } from "@/lib/tmdb/types";

export function ProviderFilter({ providers, params }: { providers: Provider[]; params: HomeParams }) {
  return (
    <nav aria-label="Filtrar por streaming" className="mb-6 flex gap-3 overflow-x-auto pb-2">
      {providers.map((provider) => {
        const selected = provider.id === params.provider;
        const logo = logoUrl(provider.logoPath);
        return (
          <Link
            key={provider.id}
            href={buildHomeHref({ region: params.region, provider: selected ? null : provider.id, page: 1 })}
            aria-current={selected ? "true" : undefined}
            title={provider.name}
            className={`shrink-0 rounded-xl p-0.5 ring-2 transition ${
              selected ? "ring-white" : "opacity-70 ring-transparent hover:opacity-100"
            }`}
          >
            {logo ? (
              <Image src={logo} alt={provider.name} width={48} height={48} className="rounded-lg" />
            ) : (
              <span className="flex h-12 items-center rounded-lg bg-neutral-800 px-3 text-xs">{provider.name}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
