import Link from "next/link";
import { buildHomeHref, MAX_PAGE, type HomeParams } from "@/lib/search-params";

const linkClass = "rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-700";
const disabledClass = "rounded-md px-4 py-2 opacity-40";

export function Pagination({ params, totalPages }: { params: HomeParams; totalPages: number }) {
  const last = Math.max(1, Math.min(totalPages, MAX_PAGE));
  const { page } = params;

  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={buildHomeHref({ ...params, page: page - 1 })} rel="prev" className={linkClass}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Anterior
        </span>
      )}
      <span>
        Página {page} de {last}
      </span>
      {page < last ? (
        <Link href={buildHomeHref({ ...params, page: page + 1 })} rel="next" className={linkClass}>
          Próxima
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Próxima
        </span>
      )}
    </nav>
  );
}
