import Image from "next/image";
import { profileUrl } from "@/lib/tmdb/images";
import type { CastMember } from "@/lib/tmdb/types";

export function CastList({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Elenco</h2>
      <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {cast.map((person) => {
          const photo = profileUrl(person.profile_path);
          return (
            <li key={person.id}>
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
                {photo ? (
                  <Image src={photo} alt={person.name} fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-400">
                    {person.name}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm font-medium">{person.name}</p>
              <p className="text-xs text-neutral-400">{person.character}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
