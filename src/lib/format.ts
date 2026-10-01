export function formatYear(date: string): string {
  return date ? date.slice(0, 4) : "";
}

export function formatRating(vote: number): string {
  if (!vote) return "—";
  return vote.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
