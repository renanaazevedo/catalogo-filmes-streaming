import type { Video } from "@/lib/tmdb/types";

export function Trailer({ video }: { video: Video }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Trailer</h2>
      <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg bg-neutral-900">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.key}`}
          title="Trailer"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
