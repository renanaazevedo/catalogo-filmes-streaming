"use client";

import { useRouter } from "next/navigation";
import { buildHomeHref } from "@/lib/search-params";
import type { Region } from "@/lib/tmdb/types";

export function RegionSelect({ regions, value }: { regions: Region[]; value: string }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      País
      <select
        value={value}
        onChange={(e) => router.push(buildHomeHref({ region: e.target.value, provider: null, page: 1 }))}
        className="rounded-md bg-neutral-800 px-2 py-1"
      >
        {regions.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
}
