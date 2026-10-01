const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

function imageUrl(size: string, path: string | null): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

export const posterUrl = (path: string | null) => imageUrl("w342", path);
export const backdropUrl = (path: string | null) => imageUrl("w1280", path);
export const logoUrl = (path: string | null) => imageUrl("w92", path);
export const profileUrl = (path: string | null) => imageUrl("w185", path);
