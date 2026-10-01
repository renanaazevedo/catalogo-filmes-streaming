# Catálogo de Filmes em Streaming — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App web Next.js que lista os filmes disponíveis por assinatura nos streamings de um país (padrão BR), com filtro por streaming, seletor de país e página de detalhes, usando a API do TMDB.

**Architecture:** React Server Components chamam o TMDB só no servidor, por meio de um cliente fino (`lib/tmdb/client.ts`). Todo o estado de navegação (país, streaming e página) vive na URL, parseado e validado por `lib/search-params.ts`. Os componentes de UI só renderizam, e toda a lógica testável fica em funções puras em `lib/`.

**Tech Stack:** Next.js (App Router, TypeScript, Tailwind CSS), Vitest + Testing Library, Playwright, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-30-catalogo-filmes-streaming-design.md`

**Desvios deliberados da spec (pequenos; valem para este plano):**
- Na home, `getRegions()` roda **antes** das outras chamadas, porque validar `region` depende da lista de países. Depois, filmes e streamings rodam em `Promise.all`. Tudo fica em cache de 6h, então o custo é desprezível.
- `ProviderFilter` usa `<Link>` em vez de `router.push`: o resultado para o usuário é o mesmo, funciona sem JS e é mais fácil de testar. `RegionSelect` continua como componente cliente.
- "← Voltar" preserva **todos** os filtros porque a URL do detalhe carrega `region`, `provider` e `page` (`/movie/550?region=BR&provider=8&page=2`), em vez de depender do histórico do navegador.

## Global Constraints

- Node.js ≥ 20 (CI usa 22).
- O token do TMDB fica **só no servidor**, em `TMDB_API_TOKEN`. Nunca use o prefixo `NEXT_PUBLIC_`.
- `TMDB_BASE_URL` é opcional e tem padrão `https://api.themoviedb.org/3`.
- "Disponível" = `with_watch_monetization_types=flatrate`.
- `language=pt-BR` fixo; região padrão `BR`; página máxima `500`; cache `revalidate: 21600`; no máximo `20` streamings no filtro; elenco com `10` pessoas.
- Textos da UI (copiar exatamente):
  - "Nenhum filme encontrado para este streaming neste país."
  - "Limpar filtro"
  - "Não foi possível carregar os filmes"
  - "Tentar de novo"
  - "Indisponível em streaming por assinatura neste país."
  - "Dados de JustWatch"
  - "Onde assistir"
  - "Anterior" / "Próxima" / "Página X de Y"
  - "← Voltar"
  - "Filme não encontrado"
  - Rodapé: "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."
- Mensagem de token ausente: `configure TMDB_API_TOKEN no .env.local`.
- Commits convencionais (`feat:`, `test:`, `chore:`, `ci:`, `docs:`), terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Os testes unitários ficam ao lado do código (`src/**/*.test.ts(x)`), e os E2E em `e2e/`.

## Fluxo de Git e PRs (decidido com o usuário)

- Repositório **público** `catalogo-filmes-streaming` no GitHub, criado logo após os commits da Task 1: `gh repo create catalogo-filmes-streaming --public --source . --remote origin`. Em seguida, `main` recebe só os commits de docs (spec e plano), e o setup vai pelo PR 1.
- Um PR por funcionalidade, cada branch criada a partir da `main` atualizada:

| PR | Branch | Tarefas |
|---|---|---|
| 1 | `chore/setup` | 1 |
| 2 | `feat/tmdb-client` | 2, 3, 4 |
| 3 | `feat/home` | 5 |
| 4 | `feat/filtros` | 6 |
| 5 | `feat/detalhes` | 7 |
| 6 | `test/e2e-deploy` | 8, 9 (passos 1–2) |

- Ao fim de cada PR: `git push -u origin <branch>`, `gh pr create --base main` (descrição curta terminando com `🤖 Generated with [Claude Code](https://claude.com/claude-code)`) e `gh pr checks --watch`.
- **Os PRs ficam abertos.** O usuário revisa cada um e autoriza o merge. Só depois disso: `gh pr merge --squash --delete-branch`, `git checkout main && git pull`, e a próxima branch.
- Os passos 3 a 5 da Task 9 (Vercel) rodam depois do merge do PR 6. A criação do repositório já foi feita após a Task 1.

## Review Focus

1. **Parâmetro repetido na URL** (`?page=2&page=3`): o Next entrega um array. O esperado é usar o primeiro valor, sem quebrar. O teste fica na Task 2.
2. **Grade vazia com `total_pages = 0`:** não pode haver loop de redirect. O esperado é mostrar o estado vazio. Teste de `lastValidPage` na Task 2.
3. **Filme sem data, com nota 0 ou sem duração:** nunca pode aparecer "NaN" ou "0h 0min". O esperado é ano vazio, nota "—" e duração oculta. Testes de `format.ts` na Task 5.
4. **Detalhe com id inválido (`/movie/abc`) ou 404 no TMDB:** o esperado é "Filme não encontrado", e não erro 500. `parseMovieId` é testado na Task 2, e o E2E na Task 8.
5. **Região em minúsculas (`?region=us`):** o esperado é normalizar para `US`. O teste fica na Task 2.

---

## Estrutura de arquivos

```
.env.example                      # TMDB_API_TOKEN=
.github/workflows/ci.yml          # lint, typecheck, test, build, e2e
next.config.ts                    # remotePatterns image.tmdb.org
vitest.config.mts, vitest.setup.ts
playwright.config.ts
e2e/
  catalogo.spec.ts
  mock-tmdb/server.mjs            # servidor HTTP que imita o TMDB
  mock-tmdb/fixtures/*.json
public/tmdb-logo.svg
src/
  app/
    globals.css, layout.tsx, page.tsx, loading.tsx, error.tsx
    movie/[id]/page.tsx, loading.tsx, not-found.tsx
  components/
    MovieCard.tsx, MovieGrid.tsx, Pagination.tsx
    ProviderFilter.tsx, RegionSelect.tsx
    WatchProviders.tsx, Trailer.tsx, CastList.tsx
  lib/
    search-params.ts              # parse/validação da URL + builders de href
    format.ts                     # formatYear, formatRating, formatRuntime
    tmdb/
      client.ts                   # tmdbFetch, TmdbError, LANGUAGE, REVALIDATE_SECONDS
      images.ts                   # posterUrl, backdropUrl, logoUrl, profileUrl
      types.ts                    # tipos das respostas e do domínio
      movies.ts                   # discoverMovies, getMovieDetails
      providers.ts                # getProviders, getRegions
      details.ts                  # pickTrailer, topCast, flatrateProviders
```

---

### Task 1: Setup do projeto (Next.js, Tailwind, Vitest, CI)

**Files:**
- Create: projeto Next.js na raiz (via `create-next-app`), `vitest.config.mts`, `vitest.setup.ts`, `.env.example`, `.github/workflows/ci.yml`
- Modify: `package.json` (scripts), `.gitignore`, `next.config.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: nada.
- Produces: scripts `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; alias `@/*` → `src/*` funcionando no Next e no Vitest; mock global de `next/image` nos testes (renderiza um `<img>` simples).

- [ ] **Step 1: Criar o app Next.js na raiz do repositório**

A raiz já contém `.git/` e `docs/`, que o `create-next-app` aceita.

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Se ele recusar a pasta por não estar vazia, gere o app numa pasta temporária e mova os arquivos:

```bash
npx create-next-app@latest /tmp/catalogo-scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude node_modules /tmp/catalogo-scaffold/ ./ && npm install
```

Esperado: existem `src/app/page.tsx`, `next.config.ts` e `package.json`.

- [ ] **Step 2: Instalar as dependências de teste**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom
```

- [ ] **Step 3: Configurar o Vitest**

`vitest.config.mts`:

```ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

`vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// next/image exige a config do Next (remotePatterns) em runtime; nos testes basta um <img>.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const rest = { ...props };
    delete rest.fill;
    delete rest.priority;
    delete rest.unoptimized;
    return createElement("img", rest);
  },
}));
```

- [ ] **Step 4: Adicionar os scripts**

```bash
npm pkg set scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.test:watch="vitest"
```

- [ ] **Step 5: Configurar imagens, CSS e variáveis de ambiente**

`next.config.ts` (substitui o conteúdo gerado):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },
};

export default nextConfig;
```

`src/app/globals.css` (substitui o conteúdo gerado; o tema escuro fica nas classes do `layout.tsx`):

```css
@import "tailwindcss";
```

`.env.example`:

```
# Token de leitura (API Read Access Token, v4) em https://www.themoviedb.org/settings/api
TMDB_API_TOKEN=
```

No `.gitignore`, logo abaixo da linha `.env*` gerada pelo Next, adicione:

```
!.env.example
```

- [ ] **Step 6: Criar o CI**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --passWithNoTests
      - run: npm run build
```

- [ ] **Step 7: Verificar**

```bash
npm run lint && npm run typecheck && npm test -- --passWithNoTests && npm run build
```

Esperado: tudo termina com código 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: setup Next.js, Tailwind, Vitest e CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Parâmetros de URL (`lib/search-params.ts`)

**Files:**
- Create: `src/lib/search-params.ts`
- Test: `src/lib/search-params.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `DEFAULT_REGION = "BR"`, `MAX_PAGE = 500`
  - `type RawSearchParams = Record<string, string | string[] | undefined>`
  - `interface HomeParams { region: string; provider: number | null; page: number }`
  - `parseRegion(value: string | string[] | undefined, validRegions?: readonly string[]): string`
  - `parseHomeParams(raw: RawSearchParams, validRegions?: readonly string[]): HomeParams`
  - `parseMovieId(value: string): number | null`
  - `lastValidPage(page: number, totalPages: number): number | null` (a página para onde redirecionar, ou `null` se não precisa)
  - `buildHomeHref(params: HomeParams): string` → `/?region=BR&provider=8&page=2` (omite `provider` nulo e `page` 1)
  - `buildMovieHref(id: number, params: HomeParams): string` → `/movie/550?region=BR&provider=8&page=2`

- [ ] **Step 1: Escrever os testes que falham**

`src/lib/search-params.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildHomeHref,
  buildMovieHref,
  lastValidPage,
  parseHomeParams,
  parseMovieId,
  parseRegion,
} from "./search-params";

const REGIONS = ["BR", "US", "PT"];

describe("parseRegion", () => {
  it("aceita região válida", () => {
    expect(parseRegion("US", REGIONS)).toBe("US");
  });
  it("normaliza minúsculas", () => {
    expect(parseRegion("us", REGIONS)).toBe("US");
  });
  it("usa BR para região fora da lista", () => {
    expect(parseRegion("ZZ", REGIONS)).toBe("BR");
  });
  it("usa BR para formato inválido ou ausente", () => {
    expect(parseRegion("brasil")).toBe("BR");
    expect(parseRegion(undefined)).toBe("BR");
  });
  it("sem lista, valida só o formato", () => {
    expect(parseRegion("ZZ")).toBe("ZZ");
  });
  it("usa o primeiro valor quando repetido", () => {
    expect(parseRegion(["US", "PT"], REGIONS)).toBe("US");
  });
});

describe("parseHomeParams", () => {
  it("aplica os padrões quando vazio", () => {
    expect(parseHomeParams({}, REGIONS)).toEqual({ region: "BR", provider: null, page: 1 });
  });
  it("lê valores válidos", () => {
    expect(parseHomeParams({ region: "US", provider: "8", page: "3" }, REGIONS)).toEqual({
      region: "US",
      provider: 8,
      page: 3,
    });
  });
  it.each(["0", "501", "abc", "2.5", "-1", ""])("page inválida %j vira 1", (page) => {
    expect(parseHomeParams({ page }, REGIONS).page).toBe(1);
  });
  it("aceita os limites 1 e 500", () => {
    expect(parseHomeParams({ page: "1" }, REGIONS).page).toBe(1);
    expect(parseHomeParams({ page: "500" }, REGIONS).page).toBe(500);
  });
  it.each(["abc", "0", "-3", "8.1"])("provider inválido %j é ignorado", (provider) => {
    expect(parseHomeParams({ provider }, REGIONS).provider).toBeNull();
  });
  it("usa o primeiro valor de parâmetros repetidos", () => {
    expect(parseHomeParams({ page: ["2", "3"], provider: ["8", "9"] }, REGIONS)).toEqual({
      region: "BR",
      provider: 8,
      page: 2,
    });
  });
});

describe("parseMovieId", () => {
  it("aceita inteiro positivo", () => {
    expect(parseMovieId("550")).toBe(550);
  });
  it.each(["abc", "0", "-1", "5.5", ""])("rejeita %j", (id) => {
    expect(parseMovieId(id)).toBeNull();
  });
});

describe("lastValidPage", () => {
  it("não redireciona dentro do intervalo", () => {
    expect(lastValidPage(2, 3)).toBeNull();
    expect(lastValidPage(3, 3)).toBeNull();
  });
  it("redireciona para a última página", () => {
    expect(lastValidPage(99, 3)).toBe(3);
  });
  it("limita a última página a 500", () => {
    expect(lastValidPage(500, 900)).toBeNull();
  });
  it("não redireciona quando não há resultados", () => {
    expect(lastValidPage(1, 0)).toBeNull();
    expect(lastValidPage(5, 0)).toBeNull();
  });
});

describe("buildHomeHref / buildMovieHref", () => {
  it("omite provider nulo e page 1", () => {
    expect(buildHomeHref({ region: "BR", provider: null, page: 1 })).toBe("/?region=BR");
  });
  it("inclui todos os filtros", () => {
    expect(buildHomeHref({ region: "US", provider: 8, page: 2 })).toBe("/?region=US&provider=8&page=2");
  });
  it("monta o link do filme carregando os filtros", () => {
    expect(buildMovieHref(550, { region: "BR", provider: 8, page: 2 })).toBe(
      "/movie/550?region=BR&provider=8&page=2",
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- src/lib/search-params.test.ts`
Esperado: FAIL, "Failed to resolve import './search-params'".

- [ ] **Step 3: Implementar**

`src/lib/search-params.ts`:

```ts
export const DEFAULT_REGION = "BR";
export const MAX_PAGE = 500;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface HomeParams {
  region: string;
  provider: number | null;
  page: number;
}

type RawValue = string | string[] | undefined;

function first(value: RawValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: RawValue): number | null {
  const text = first(value);
  if (!text || !/^\d+$/.test(text)) return null;
  const n = Number(text);
  return n >= 1 ? n : null;
}

export function parseRegion(value: RawValue, validRegions?: readonly string[]): string {
  const code = first(value)?.toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return DEFAULT_REGION;
  if (validRegions && !validRegions.includes(code)) return DEFAULT_REGION;
  return code;
}

export function parseHomeParams(raw: RawSearchParams, validRegions?: readonly string[]): HomeParams {
  const page = parsePositiveInt(raw.page);
  return {
    region: parseRegion(raw.region, validRegions),
    provider: parsePositiveInt(raw.provider),
    page: page !== null && page <= MAX_PAGE ? page : 1,
  };
}

export function parseMovieId(value: string): number | null {
  return parsePositiveInt(value);
}

export function lastValidPage(page: number, totalPages: number): number | null {
  const last = Math.min(totalPages, MAX_PAGE);
  return last >= 1 && page > last ? last : null;
}

function toQuery({ region, provider, page }: HomeParams): string {
  const query = new URLSearchParams({ region });
  if (provider !== null) query.set("provider", String(provider));
  if (page > 1) query.set("page", String(page));
  return query.toString();
}

export function buildHomeHref(params: HomeParams): string {
  return `/?${toQuery(params)}`;
}

export function buildMovieHref(id: number, params: HomeParams): string {
  return `/movie/${id}?${toQuery(params)}`;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- src/lib/search-params.test.ts`
Esperado: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/search-params.ts src/lib/search-params.test.ts
git commit -m "feat: parse e validação dos parâmetros de URL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Cliente HTTP do TMDB e URLs de imagem

**Files:**
- Create: `src/lib/tmdb/client.ts`, `src/lib/tmdb/images.ts`
- Test: `src/lib/tmdb/client.test.ts`, `src/lib/tmdb/images.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `LANGUAGE = "pt-BR"`, `REVALIDATE_SECONDS = 21600`
  - `class TmdbError extends Error { status: number }`
  - `type QueryParams = Record<string, string | number | undefined>`
  - `tmdbFetch<T>(path: string, params?: QueryParams): Promise<T>`: `path` começa com `/` (ex.: `/discover/movie`), e parâmetros `undefined` são omitidos
  - `posterUrl`, `backdropUrl`, `logoUrl`, `profileUrl`, todas `(path: string | null) => string | null`

- [ ] **Step 1: Escrever os testes que falham**

`src/lib/tmdb/client.test.ts`:

```ts
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REVALIDATE_SECONDS, TmdbError, tmdbFetch } from "./client";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TMDB_API_TOKEN", "test-token");
  vi.stubEnv("TMDB_BASE_URL", "");
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("tmdbFetch", () => {
  it("chama a URL padrão com os parâmetros, omitindo undefined", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await tmdbFetch("/discover/movie", { page: 2, watch_region: "BR", with_watch_providers: undefined });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.themoviedb.org/3/discover/movie");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("watch_region")).toBe("BR");
    expect(url.searchParams.has("with_watch_providers")).toBe(false);
  });

  it("envia o token como Bearer e usa cache de 6h", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await tmdbFetch("/x");
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(init.next).toEqual({ revalidate: REVALIDATE_SECONDS });
    expect(REVALIDATE_SECONDS).toBe(21600);
  });

  it("respeita TMDB_BASE_URL", async () => {
    vi.stubEnv("TMDB_BASE_URL", "http://localhost:4010/3");
    fetchMock.mockResolvedValue(jsonResponse({}));
    await tmdbFetch("/movie/1");
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:4010/3/movie/1");
  });

  it("retorna o JSON da resposta", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 550 }));
    await expect(tmdbFetch<{ id: number }>("/movie/550")).resolves.toEqual({ id: 550 });
  });

  it("falha com mensagem clara sem token", async () => {
    vi.stubEnv("TMDB_API_TOKEN", "");
    await expect(tmdbFetch("/x")).rejects.toThrow("configure TMDB_API_TOKEN no .env.local");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 404, 500])("lança TmdbError com status %i", async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ status_message: "erro do tmdb" }, status));
    const error = await tmdbFetch("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TmdbError);
    expect((error as TmdbError).status).toBe(status);
    expect((error as TmdbError).message).toBe("erro do tmdb");
  });

  it("lança TmdbError mesmo com corpo que não é JSON", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 502, statusText: "Bad Gateway" }));
    const error = await tmdbFetch("/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TmdbError);
    expect((error as TmdbError).status).toBe(502);
  });
});
```

`src/lib/tmdb/images.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { backdropUrl, logoUrl, posterUrl, profileUrl } from "./images";

describe("images", () => {
  it("monta as URLs com o tamanho de cada tipo", () => {
    expect(posterUrl("/a.jpg")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
    expect(backdropUrl("/b.jpg")).toBe("https://image.tmdb.org/t/p/w1280/b.jpg");
    expect(logoUrl("/c.jpg")).toBe("https://image.tmdb.org/t/p/w92/c.jpg");
    expect(profileUrl("/d.jpg")).toBe("https://image.tmdb.org/t/p/w185/d.jpg");
  });
  it("retorna null sem caminho", () => {
    expect(posterUrl(null)).toBeNull();
    expect(profileUrl(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- src/lib/tmdb`
Esperado: FAIL, "Failed to resolve import './client'" e "'./images'".

- [ ] **Step 3: Implementar**

`src/lib/tmdb/client.ts`:

```ts
const DEFAULT_BASE_URL = "https://api.themoviedb.org/3";

export const LANGUAGE = "pt-BR";
export const REVALIDATE_SECONDS = 21600; // 6h

export class TmdbError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export type QueryParams = Record<string, string | number | undefined>;

export async function tmdbFetch<T>(path: string, params: QueryParams = {}): Promise<T> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) throw new Error("configure TMDB_API_TOKEN no .env.local");

  const baseUrl = process.env.TMDB_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(baseUrl + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { status_message?: string };
      message = body.status_message ?? message;
    } catch {
      // corpo não é JSON: mantém o statusText
    }
    throw new TmdbError(response.status, message);
  }

  return (await response.json()) as T;
}
```

`src/lib/tmdb/images.ts`:

```ts
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

function imageUrl(size: string, path: string | null): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

export const posterUrl = (path: string | null) => imageUrl("w342", path);
export const backdropUrl = (path: string | null) => imageUrl("w1280", path);
export const logoUrl = (path: string | null) => imageUrl("w92", path);
export const profileUrl = (path: string | null) => imageUrl("w185", path);
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- src/lib/tmdb && npm run typecheck`
Esperado: PASS; typecheck sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tmdb
git commit -m "feat: cliente HTTP do TMDB e URLs de imagem

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tipos e funções de dados do TMDB (filmes, streamings e países)

**Files:**
- Create: `src/lib/tmdb/types.ts`, `src/lib/tmdb/movies.ts`, `src/lib/tmdb/providers.ts`
- Test: `src/lib/tmdb/movies.test.ts`, `src/lib/tmdb/providers.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `LANGUAGE` (Task 3); `HomeParams` (Task 2).
- Produces:
  - Tipos: `MovieSummary`, `DiscoverResponse`, `Provider { id; name; logoPath: string | null; priority }`, `Region { code; name }`, `ProviderLogo`, `RegionWatchProviders`, `CastMember`, `Video`, `MovieDetails` (definições exatas abaixo)
  - `discoverMovies(params: HomeParams): Promise<DiscoverResponse>`
  - `getMovieDetails(id: number): Promise<MovieDetails>`
  - `MAX_PROVIDERS = 20`; `getProviders(region: string): Promise<Provider[]>` (ordenados por prioridade no país, no máximo 20)
  - `getRegions(): Promise<Region[]>` (ordenados por nome em pt-BR)

- [ ] **Step 1: Criar os tipos**

`src/lib/tmdb/types.ts`:

```ts
export interface MovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string; // "YYYY-MM-DD" ou ""
  vote_average: number;
}

export interface DiscoverResponse {
  page: number;
  results: MovieSummary[];
  total_pages: number;
  total_results: number;
}

export interface ProviderApi {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  display_priorities?: Record<string, number>;
}

export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
  priority: number;
}

export interface RegionApi {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export interface Region {
  code: string;
  name: string;
}

export interface ProviderLogo {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface RegionWatchProviders {
  link?: string;
  flatrate?: ProviderLogo[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  iso_639_1: string;
}

export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
  credits: { cast: CastMember[] };
  videos: { results: Video[] };
  "watch/providers": { results: Record<string, RegionWatchProviders> };
}
```

- [ ] **Step 2: Escrever os testes que falham**

`src/lib/tmdb/movies.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmdbFetch } from "./client";
import { discoverMovies, getMovieDetails } from "./movies";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  tmdbFetch: vi.fn(),
}));

const fetchMock = vi.mocked(tmdbFetch);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({});
});

describe("discoverMovies", () => {
  it("pede só filmes de assinatura no país, com o streaming escolhido", async () => {
    await discoverMovies({ region: "US", provider: 8, page: 3 });
    expect(fetchMock).toHaveBeenCalledWith("/discover/movie", {
      watch_region: "US",
      with_watch_monetization_types: "flatrate",
      with_watch_providers: 8,
      language: "pt-BR",
      sort_by: "popularity.desc",
      page: 3,
    });
  });

  it("não envia with_watch_providers sem streaming selecionado", async () => {
    await discoverMovies({ region: "BR", provider: null, page: 1 });
    const params = fetchMock.mock.calls[0][1]!;
    expect(params.with_watch_providers).toBeUndefined();
    expect(params.with_watch_monetization_types).toBe("flatrate");
  });
});

describe("getMovieDetails", () => {
  it("pede detalhes com elenco, vídeos e streamings", async () => {
    await getMovieDetails(550);
    expect(fetchMock).toHaveBeenCalledWith("/movie/550", {
      language: "pt-BR",
      append_to_response: "credits,videos,watch/providers",
      include_video_language: "pt,en",
    });
  });
});
```

`src/lib/tmdb/providers.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmdbFetch } from "./client";
import { getProviders, getRegions, MAX_PROVIDERS } from "./providers";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  tmdbFetch: vi.fn(),
}));

const fetchMock = vi.mocked(tmdbFetch);

beforeEach(() => fetchMock.mockReset());

describe("getProviders", () => {
  it("pede os streamings do país e ordena pela prioridade regional", async () => {
    fetchMock.mockResolvedValue({
      results: [
        { provider_id: 1, provider_name: "A", logo_path: "/a.png", display_priority: 1, display_priorities: { BR: 30 } },
        { provider_id: 8, provider_name: "Netflix", logo_path: "/n.png", display_priority: 50, display_priorities: { BR: 2 } },
        { provider_id: 9, provider_name: "Sem regional", logo_path: null, display_priority: 10 },
      ],
    });
    const providers = await getProviders("BR");
    expect(fetchMock).toHaveBeenCalledWith("/watch/providers/movie", { watch_region: "BR", language: "pt-BR" });
    expect(providers.map((p) => p.id)).toEqual([8, 9, 1]);
    expect(providers[0]).toEqual({ id: 8, name: "Netflix", logoPath: "/n.png", priority: 2 });
  });

  it("limita a 20 streamings", async () => {
    fetchMock.mockResolvedValue({
      results: Array.from({ length: 30 }, (_, i) => ({
        provider_id: i + 1,
        provider_name: `P${i}`,
        logo_path: null,
        display_priority: i,
      })),
    });
    expect(MAX_PROVIDERS).toBe(20);
    expect(await getProviders("BR")).toHaveLength(20);
  });
});

describe("getRegions", () => {
  it("mapeia e ordena os países por nome em pt-BR", async () => {
    fetchMock.mockResolvedValue({
      results: [
        { iso_3166_1: "US", english_name: "United States of America", native_name: "Estados Unidos" },
        { iso_3166_1: "AT", english_name: "Austria", native_name: "Áustria" },
        { iso_3166_1: "BR", english_name: "Brazil", native_name: "Brasil" },
        { iso_3166_1: "XK", english_name: "Kosovo", native_name: "" },
      ],
    });
    const regions = await getRegions();
    expect(fetchMock).toHaveBeenCalledWith("/watch/providers/regions", { language: "pt-BR" });
    expect(regions).toEqual([
      { code: "AT", name: "Áustria" },
      { code: "BR", name: "Brasil" },
      { code: "US", name: "Estados Unidos" },
      { code: "XK", name: "Kosovo" },
    ]);
  });
});
```

- [ ] **Step 3: Rodar e confirmar a falha**

Run: `npm test -- src/lib/tmdb/movies.test.ts src/lib/tmdb/providers.test.ts`
Esperado: FAIL, "Failed to resolve import './movies'" e "'./providers'".

- [ ] **Step 4: Implementar**

`src/lib/tmdb/movies.ts`:

```ts
import type { HomeParams } from "@/lib/search-params";
import { LANGUAGE, tmdbFetch } from "./client";
import type { DiscoverResponse, MovieDetails } from "./types";

export function discoverMovies({ region, provider, page }: HomeParams): Promise<DiscoverResponse> {
  return tmdbFetch<DiscoverResponse>("/discover/movie", {
    watch_region: region,
    with_watch_monetization_types: "flatrate",
    with_watch_providers: provider ?? undefined,
    language: LANGUAGE,
    sort_by: "popularity.desc",
    page,
  });
}

export function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    language: LANGUAGE,
    append_to_response: "credits,videos,watch/providers",
    include_video_language: "pt,en",
  });
}
```

`src/lib/tmdb/providers.ts`:

```ts
import { LANGUAGE, tmdbFetch } from "./client";
import type { Provider, ProviderApi, Region, RegionApi } from "./types";

export const MAX_PROVIDERS = 20;

export async function getProviders(region: string): Promise<Provider[]> {
  const data = await tmdbFetch<{ results: ProviderApi[] }>("/watch/providers/movie", {
    watch_region: region,
    language: LANGUAGE,
  });
  return data.results
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path,
      priority: p.display_priorities?.[region] ?? p.display_priority,
    }))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_PROVIDERS);
}

export async function getRegions(): Promise<Region[]> {
  const data = await tmdbFetch<{ results: RegionApi[] }>("/watch/providers/regions", { language: LANGUAGE });
  return data.results
    .map((r) => ({ code: r.iso_3166_1, name: r.native_name || r.english_name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npm test && npm run typecheck`
Esperado: PASS; typecheck sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tmdb
git commit -m "feat: busca de filmes, streamings e países no TMDB

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Home com grade, paginação, layout e estados

**Files:**
- Create: `src/lib/format.ts`, `src/components/MovieCard.tsx`, `src/components/MovieGrid.tsx`, `src/components/Pagination.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `public/tmdb-logo.svg`
- Modify (substituir o conteúdo): `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `src/lib/format.test.ts`, `src/components/MovieCard.test.tsx`, `src/components/Pagination.test.tsx`

**Interfaces:**
- Consumes: `HomeParams`, `RawSearchParams`, `parseHomeParams`, `lastValidPage`, `buildHomeHref`, `buildMovieHref`, `MAX_PAGE` (Task 2); `posterUrl` (Task 3); `discoverMovies`, `getRegions`, `MovieSummary` (Task 4).
- Produces:
  - `formatYear(date: string): string`, `formatRating(vote: number): string`, `formatRuntime(minutes: number | null): string | null`
  - `<MovieCard movie={MovieSummary} params={HomeParams} />`
  - `<MovieGrid movies={MovieSummary[]} params={HomeParams} />`
  - `<Pagination params={HomeParams} totalPages={number} />`
  - `src/app/page.tsx` com o comentário `{/* filtros */}` no ponto onde a Task 6 insere `ProviderFilter` e `RegionSelect`

- [ ] **Step 1: Escrever os testes que falham**

`src/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatRating, formatRuntime, formatYear } from "./format";

describe("formatYear", () => {
  it("extrai o ano", () => expect(formatYear("2024-05-10")).toBe("2024"));
  it("vazio sem data", () => expect(formatYear("")).toBe(""));
});

describe("formatRating", () => {
  it("uma casa decimal com vírgula", () => expect(formatRating(7.456)).toBe("7,5"));
  it("inteiro ganha ,0", () => expect(formatRating(8)).toBe("8,0"));
  it("travessão sem nota", () => expect(formatRating(0)).toBe("—"));
});

describe("formatRuntime", () => {
  it("horas e minutos", () => expect(formatRuntime(130)).toBe("2h 10min"));
  it("só minutos", () => expect(formatRuntime(45)).toBe("45min"));
  it("hora cheia", () => expect(formatRuntime(120)).toBe("2h"));
  it("null sem duração", () => {
    expect(formatRuntime(null)).toBeNull();
    expect(formatRuntime(0)).toBeNull();
  });
});
```

`src/components/MovieCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MovieSummary } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

const params = { region: "BR", provider: 8, page: 2 };
const movie: MovieSummary = {
  id: 550,
  title: "Clube da Luta",
  poster_path: "/poster.jpg",
  release_date: "1999-10-15",
  vote_average: 8.4,
};

describe("MovieCard", () => {
  it("mostra pôster, título, ano e nota, com link que carrega os filtros", () => {
    render(<MovieCard movie={movie} params={params} />);
    expect(screen.getByRole("img", { name: "Pôster de Clube da Luta" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w342/poster.jpg",
    );
    expect(screen.getByRole("heading", { name: "Clube da Luta" })).toBeInTheDocument();
    expect(screen.getByText("1999 · ⭐ 8,4")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/550?region=BR&provider=8&page=2");
  });

  it("usa placeholder sem pôster e não mostra 'NaN' sem data", () => {
    render(<MovieCard movie={{ ...movie, poster_path: null, release_date: "", vote_average: 0 }} params={params} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("poster-placeholder")).toHaveTextContent("Clube da Luta");
    expect(screen.getByText("⭐ —")).toBeInTheDocument();
  });
});
```

`src/components/Pagination.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("na primeira página só há 'Próxima'", () => {
    render(<Pagination params={{ region: "BR", provider: null, page: 1 }} totalPages={3} />);
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/?region=BR&page=2");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("na última página só há 'Anterior', preservando os filtros", () => {
    render(<Pagination params={{ region: "US", provider: 8, page: 3 }} totalPages={3} />);
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/?region=US&provider=8&page=2");
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
  });

  it("limita o total a 500 páginas", () => {
    render(<Pagination params={{ region: "BR", provider: null, page: 500 }} totalPages={900} />);
    expect(screen.getByText("Página 500 de 500")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- src/lib/format.test.ts src/components`
Esperado: FAIL, imports não resolvidos.

- [ ] **Step 3: Implementar a formatação e os componentes**

`src/lib/format.ts`:

```ts
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
```

`src/components/MovieCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatRating, formatYear } from "@/lib/format";
import { buildMovieHref, type HomeParams } from "@/lib/search-params";
import { posterUrl } from "@/lib/tmdb/images";
import type { MovieSummary } from "@/lib/tmdb/types";

export function MovieCard({ movie, params }: { movie: MovieSummary; params: HomeParams }) {
  const poster = posterUrl(movie.poster_path);
  const year = formatYear(movie.release_date);

  return (
    <Link href={buildMovieHref(movie.id, params)} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        {poster ? (
          <Image
            src={poster}
            alt={`Pôster de ${movie.title}`}
            fill
            sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div
            data-testid="poster-placeholder"
            className="flex h-full items-center justify-center p-3 text-center text-sm text-neutral-400"
          >
            {movie.title}
          </div>
        )}
      </div>
      <h2 className="mt-2 line-clamp-2 text-sm font-medium">{movie.title}</h2>
      <p className="text-xs text-neutral-400">
        {year ? `${year} · ` : ""}⭐ {formatRating(movie.vote_average)}
      </p>
    </Link>
  );
}
```

Observação para o teste: `{year ? ... : ""}⭐ {...}` gera nós de texto adjacentes dentro do mesmo `<p>`, e o `getByText` compara o `textContent` normalizado, então "1999 · ⭐ 8,4" casa.

`src/components/MovieGrid.tsx`:

```tsx
import type { HomeParams } from "@/lib/search-params";
import type { MovieSummary } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

export function MovieGrid({ movies, params }: { movies: MovieSummary[]; params: HomeParams }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} params={params} />
        </li>
      ))}
    </ul>
  );
}
```

`src/components/Pagination.tsx`:

```tsx
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- src/lib/format.test.ts src/components`
Esperado: PASS.

- [ ] **Step 5: Baixar o logo do TMDB**

```bash
curl -fsSL -o public/tmdb-logo.svg "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
head -c 100 public/tmdb-logo.svg
```

Esperado: a saída começa com `<svg` (ou `<?xml`). Se a URL tiver mudado, baixe a versão "blue_short" SVG em https://www.themoviedb.org/about/logos-attribution e salve como `public/tmdb-logo.svg`.

- [ ] **Step 6: Layout, página, loading e erro**

`src/app/layout.tsx` (substitui o gerado):

```tsx
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
          <Image src="/tmdb-logo.svg" alt="TMDB" width={80} height={12} unoptimized />
          <p>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
        </footer>
      </body>
    </html>
  );
}
```

`src/app/page.tsx` (substitui o gerado):

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";
import { buildHomeHref, lastValidPage, parseHomeParams, type RawSearchParams } from "@/lib/search-params";
import { discoverMovies } from "@/lib/tmdb/movies";
import { getRegions } from "@/lib/tmdb/providers";

export default async function Home({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const regions = await getRegions();
  const params = parseHomeParams(
    await searchParams,
    regions.map((r) => r.code),
  );
  const movies = await discoverMovies(params);

  const redirectPage = lastValidPage(params.page, movies.total_pages);
  if (redirectPage !== null) redirect(buildHomeHref({ ...params, page: redirectPage }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Em cartaz no streaming</h1>
        {/* filtros */}
      </header>

      {movies.results.length === 0 ? (
        <div className="py-16 text-center text-neutral-400">
          <p>Nenhum filme encontrado para este streaming neste país.</p>
          {params.provider !== null && (
            <Link
              href={buildHomeHref({ ...params, provider: null, page: 1 })}
              className="mt-4 inline-block underline hover:text-white"
            >
              Limpar filtro
            </Link>
          )}
        </div>
      ) : (
        <>
          <MovieGrid movies={movies.results} params={params} />
          <Pagination params={params} totalPages={movies.total_pages} />
        </>
      )}
    </main>
  );
}
```

`src/app/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6" aria-busy="true">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-neutral-800" />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[2/3] animate-pulse rounded-lg bg-neutral-800" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`src/app/error.tsx`:

```tsx
"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 text-center">
      <p className="text-lg">Não foi possível carregar os filmes</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-neutral-800 px-4 py-2 hover:bg-neutral-700"
      >
        Tentar de novo
      </button>
    </main>
  );
}
```

- [ ] **Step 7: Verificar tudo e testar manualmente**

```bash
npm test && npm run lint && npm run typecheck && npm run build
```

Esperado: tudo passa. Depois, com um `TMDB_API_TOKEN` real em `.env.local`, rode `npm run dev` e abra `http://localhost:3000`. Deve aparecer a grade de filmes do Brasil, e "Próxima" deve levar a `/?region=BR&page=2`. `http://localhost:3000/?page=99999` deve voltar para página 1, porque a página é inválida.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: home com grade de filmes, paginação e estados

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Filtros de streaming e país

**Files:**
- Create: `src/components/ProviderFilter.tsx`, `src/components/RegionSelect.tsx`
- Modify (substituir o conteúdo): `src/app/page.tsx`
- Test: `src/components/ProviderFilter.test.tsx`, `src/components/RegionSelect.test.tsx`

**Interfaces:**
- Consumes: `HomeParams`, `buildHomeHref` (Task 2); `logoUrl` (Task 3); `Provider`, `Region`, `getProviders`, `getRegions`, `discoverMovies` (Task 4); a home da Task 5.
- Produces:
  - `<ProviderFilter providers={Provider[]} params={HomeParams} />`: server component com um link por streaming e `aria-current="true"` no selecionado
  - `<RegionSelect regions={Region[]} value={string} />`: client component com o rótulo acessível "País"

- [ ] **Step 1: Escrever os testes que falham**

`src/components/ProviderFilter.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Provider } from "@/lib/tmdb/types";
import { ProviderFilter } from "./ProviderFilter";

const providers: Provider[] = [
  { id: 8, name: "Netflix", logoPath: "/n.png", priority: 1 },
  { id: 119, name: "Amazon Prime Video", logoPath: null, priority: 2 },
];

describe("ProviderFilter", () => {
  it("cada streaming leva à página 1 filtrada, mantendo o país", () => {
    render(<ProviderFilter providers={providers} params={{ region: "BR", provider: null, page: 4 }} />);
    expect(screen.getByRole("link", { name: "Netflix" })).toHaveAttribute("href", "/?region=BR&provider=8");
    expect(screen.getByRole("link", { name: "Amazon Prime Video" })).toHaveAttribute(
      "href",
      "/?region=BR&provider=119",
    );
  });

  it("marca o selecionado, e clicar nele limpa o filtro", () => {
    render(<ProviderFilter providers={providers} params={{ region: "BR", provider: 8, page: 2 }} />);
    const netflix = screen.getByRole("link", { name: "Netflix" });
    expect(netflix).toHaveAttribute("aria-current", "true");
    expect(netflix).toHaveAttribute("href", "/?region=BR");
    expect(screen.getByRole("link", { name: "Amazon Prime Video" })).not.toHaveAttribute("aria-current");
  });

  it("sem logo, mostra o nome", () => {
    render(<ProviderFilter providers={providers} params={{ region: "BR", provider: null, page: 1 }} />);
    expect(screen.getByText("Amazon Prime Video")).toBeInTheDocument();
  });
});
```

`src/components/RegionSelect.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegionSelect } from "./RegionSelect";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const regions = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
];

beforeEach(() => push.mockReset());

describe("RegionSelect", () => {
  it("mostra o país atual selecionado", () => {
    render(<RegionSelect regions={regions} value="BR" />);
    expect(screen.getByLabelText("País")).toHaveValue("BR");
  });

  it("trocar o país zera streaming e página", () => {
    render(<RegionSelect regions={regions} value="BR" />);
    fireEvent.change(screen.getByLabelText("País"), { target: { value: "US" } });
    expect(push).toHaveBeenCalledWith("/?region=US");
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- src/components/ProviderFilter.test.tsx src/components/RegionSelect.test.tsx`
Esperado: FAIL, imports não resolvidos.

- [ ] **Step 3: Implementar**

`src/components/ProviderFilter.tsx`:

```tsx
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
```

`src/components/RegionSelect.tsx`:

```tsx
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
```

- [ ] **Step 4: Ligar os filtros na home**

`src/app/page.tsx` (conteúdo completo):

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { MovieGrid } from "@/components/MovieGrid";
import { Pagination } from "@/components/Pagination";
import { ProviderFilter } from "@/components/ProviderFilter";
import { RegionSelect } from "@/components/RegionSelect";
import { buildHomeHref, lastValidPage, parseHomeParams, type RawSearchParams } from "@/lib/search-params";
import { discoverMovies } from "@/lib/tmdb/movies";
import { getProviders, getRegions } from "@/lib/tmdb/providers";

export default async function Home({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const regions = await getRegions();
  const params = parseHomeParams(
    await searchParams,
    regions.map((r) => r.code),
  );
  const [movies, providers] = await Promise.all([discoverMovies(params), getProviders(params.region)]);

  const redirectPage = lastValidPage(params.page, movies.total_pages);
  if (redirectPage !== null) redirect(buildHomeHref({ ...params, page: redirectPage }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Em cartaz no streaming</h1>
        <RegionSelect regions={regions} value={params.region} />
      </header>

      <ProviderFilter providers={providers} params={params} />

      {movies.results.length === 0 ? (
        <div className="py-16 text-center text-neutral-400">
          <p>Nenhum filme encontrado para este streaming neste país.</p>
          {params.provider !== null && (
            <Link
              href={buildHomeHref({ ...params, provider: null, page: 1 })}
              className="mt-4 inline-block underline hover:text-white"
            >
              Limpar filtro
            </Link>
          )}
        </div>
      ) : (
        <>
          <MovieGrid movies={movies.results} params={params} />
          <Pagination params={params} totalPages={movies.total_pages} />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Verificar**

```bash
npm test && npm run lint && npm run typecheck && npm run build
```

Esperado: tudo passa. Teste manual com `npm run dev`: clicar em Netflix leva a `?provider=8`; clicar de novo remove o filtro; trocar o país para "Estados Unidos" leva a `/?region=US` e troca os logos.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: filtros de streaming e país

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Página de detalhes do filme

**Files:**
- Create: `src/lib/tmdb/details.ts`, `src/components/WatchProviders.tsx`, `src/components/Trailer.tsx`, `src/components/CastList.tsx`, `src/app/movie/[id]/page.tsx`, `src/app/movie/[id]/loading.tsx`, `src/app/movie/[id]/not-found.tsx`
- Test: `src/lib/tmdb/details.test.ts`, `src/components/WatchProviders.test.tsx`, `src/components/Trailer.test.tsx`

**Interfaces:**
- Consumes: `parseMovieId`, `parseHomeParams`, `buildHomeHref`, `RawSearchParams` (Task 2); `TmdbError`, `posterUrl`, `backdropUrl`, `logoUrl`, `profileUrl` (Task 3); `getMovieDetails`, `MovieDetails`, `Video`, `CastMember`, `ProviderLogo` (Task 4); `formatYear`, `formatRating`, `formatRuntime` (Task 5).
- Produces:
  - `pickTrailer(videos: Video[]): Video | null`
  - `TOP_CAST = 10`; `topCast(cast: CastMember[]): CastMember[]`
  - `interface RegionWatchInfo { link: string | null; providers: ProviderLogo[] }`; `flatrateProviders(watch: MovieDetails["watch/providers"] | undefined, region: string): RegionWatchInfo`
  - `<WatchProviders info={RegionWatchInfo} />`, `<Trailer video={Video} />`, `<CastList cast={CastMember[]} />`
  - Rota `/movie/[id]` com título `<h1>` e seções "Onde assistir", "Trailer" (opcional) e "Elenco"

- [ ] **Step 1: Escrever os testes que falham**

`src/lib/tmdb/details.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { flatrateProviders, pickTrailer, topCast } from "./details";
import type { CastMember, Video } from "./types";

const video = (over: Partial<Video>): Video => ({ key: "k", site: "YouTube", type: "Trailer", iso_639_1: "en", ...over });

describe("pickTrailer", () => {
  it("prefere trailer em português", () => {
    const videos = [video({ key: "en1" }), video({ key: "pt1", iso_639_1: "pt" })];
    expect(pickTrailer(videos)?.key).toBe("pt1");
  });
  it("cai para inglês", () => {
    expect(pickTrailer([video({ key: "es1", iso_639_1: "es" }), video({ key: "en1" })])?.key).toBe("en1");
  });
  it("ignora o que não é trailer do YouTube", () => {
    const videos = [video({ key: "t", type: "Teaser" }), video({ key: "v", site: "Vimeo" })];
    expect(pickTrailer(videos)).toBeNull();
  });
  it("aceita trailer de outro idioma se for o único", () => {
    expect(pickTrailer([video({ key: "es1", iso_639_1: "es" })])?.key).toBe("es1");
  });
});

describe("topCast", () => {
  it("ordena por order e limita a 10", () => {
    const cast: CastMember[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      name: `Ator ${i}`,
      character: "X",
      profile_path: null,
      order: 14 - i,
    }));
    const result = topCast(cast);
    expect(result).toHaveLength(10);
    expect(result[0].order).toBe(0);
    expect(result[9].order).toBe(9);
  });
});

describe("flatrateProviders", () => {
  const netflix = { provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" };
  const watch = { results: { BR: { link: "https://tmdb/watch", flatrate: [netflix] }, US: { link: "https://tmdb/us" } } };

  it("retorna link e streamings de assinatura do país", () => {
    expect(flatrateProviders(watch, "BR")).toEqual({ link: "https://tmdb/watch", providers: [netflix] });
  });
  it("país sem flatrate retorna lista vazia", () => {
    expect(flatrateProviders(watch, "US")).toEqual({ link: "https://tmdb/us", providers: [] });
  });
  it("país ausente ou dados ausentes", () => {
    expect(flatrateProviders(watch, "PT")).toEqual({ link: null, providers: [] });
    expect(flatrateProviders(undefined, "BR")).toEqual({ link: null, providers: [] });
  });
});
```

`src/components/WatchProviders.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WatchProviders } from "./WatchProviders";

describe("WatchProviders", () => {
  it("lista os streamings com link e crédito da JustWatch", () => {
    render(
      <WatchProviders
        info={{
          link: "https://www.themoviedb.org/movie/550/watch?locale=BR",
          providers: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" }],
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Onde assistir" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Netflix" })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/550/watch?locale=BR",
    );
    expect(screen.getByText("Dados de JustWatch")).toBeInTheDocument();
  });

  it("avisa quando não há streaming no país", () => {
    render(<WatchProviders info={{ link: null, providers: [] }} />);
    expect(screen.getByText("Indisponível em streaming por assinatura neste país.")).toBeInTheDocument();
    expect(screen.queryByText("Dados de JustWatch")).not.toBeInTheDocument();
  });
});
```

`src/components/Trailer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Trailer } from "./Trailer";

describe("Trailer", () => {
  it("incorpora via youtube-nocookie", () => {
    render(<Trailer video={{ key: "abc123", site: "YouTube", type: "Trailer", iso_639_1: "pt" }} />);
    expect(screen.getByTitle("Trailer")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/abc123");
  });
});
```

- [ ] **Step 2: Rodar e confirmar a falha**

Run: `npm test -- src/lib/tmdb/details.test.ts src/components/WatchProviders.test.tsx src/components/Trailer.test.tsx`
Esperado: FAIL, imports não resolvidos.

- [ ] **Step 3: Implementar as funções puras e os componentes**

`src/lib/tmdb/details.ts`:

```ts
import type { CastMember, MovieDetails, ProviderLogo, Video } from "./types";

export const TOP_CAST = 10;

export function pickTrailer(videos: Video[]): Video | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  return (
    trailers.find((v) => v.iso_639_1 === "pt") ??
    trailers.find((v) => v.iso_639_1 === "en") ??
    trailers[0] ??
    null
  );
}

export function topCast(cast: CastMember[]): CastMember[] {
  return [...cast].sort((a, b) => a.order - b.order).slice(0, TOP_CAST);
}

export interface RegionWatchInfo {
  link: string | null;
  providers: ProviderLogo[];
}

export function flatrateProviders(
  watch: MovieDetails["watch/providers"] | undefined,
  region: string,
): RegionWatchInfo {
  const entry = watch?.results?.[region];
  return { link: entry?.link ?? null, providers: entry?.flatrate ?? [] };
}
```

`src/components/WatchProviders.tsx`:

```tsx
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
```

`src/components/Trailer.tsx`:

```tsx
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
```

`src/components/CastList.tsx`:

```tsx
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- src/lib/tmdb/details.test.ts src/components`
Esperado: PASS.

- [ ] **Step 5: Criar a rota de detalhes**

`src/app/movie/[id]/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CastList } from "@/components/CastList";
import { Trailer } from "@/components/Trailer";
import { WatchProviders } from "@/components/WatchProviders";
import { formatRating, formatRuntime, formatYear } from "@/lib/format";
import { buildHomeHref, parseHomeParams, parseMovieId, type RawSearchParams } from "@/lib/search-params";
import { TmdbError } from "@/lib/tmdb/client";
import { flatrateProviders, pickTrailer, topCast } from "@/lib/tmdb/details";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import { getMovieDetails } from "@/lib/tmdb/movies";
import type { MovieDetails } from "@/lib/tmdb/types";

async function loadMovie(id: number): Promise<MovieDetails> {
  try {
    return await getMovieDetails(id);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) notFound();
    throw error;
  }
}

export default async function MoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const movieId = parseMovieId((await params).id);
  if (movieId === null) notFound();

  const homeParams = parseHomeParams(await searchParams);
  const movie = await loadMovie(movieId);

  const backdrop = backdropUrl(movie.backdrop_path);
  const poster = posterUrl(movie.poster_path);
  const trailer = pickTrailer(movie.videos.results);
  const meta = [formatYear(movie.release_date), formatRuntime(movie.runtime), movie.genres.map((g) => g.name).join(", ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <main>
      {backdrop && (
        <div className="relative h-56 w-full md:h-96">
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link href={buildHomeHref(homeParams)} className="text-sm text-neutral-400 hover:text-white">
          ← Voltar
        </Link>

        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
            {poster ? (
              <Image src={poster} alt={`Pôster de ${movie.title}`} fill sizes="192px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-3 text-center text-sm text-neutral-400">
                {movie.title}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            {meta && <p className="mt-1 text-sm text-neutral-400">{meta}</p>}
            <p className="mt-2">⭐ {formatRating(movie.vote_average)}</p>
            <p className="mt-4 leading-relaxed">{movie.overview || "Sinopse indisponível."}</p>
          </div>
        </div>

        <WatchProviders info={flatrateProviders(movie["watch/providers"], homeParams.region)} />
        {trailer && <Trailer video={trailer} />}
        <CastList cast={topCast(movie.credits.cast)} />
      </div>
    </main>
  );
}
```

`src/app/movie/[id]/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6" aria-busy="true">
      <div className="h-4 w-20 animate-pulse rounded bg-neutral-800" />
      <div className="mt-4 flex flex-col gap-6 md:flex-row">
        <div className="aspect-[2/3] w-48 animate-pulse rounded-lg bg-neutral-800" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-800" />
          <div className="h-24 w-full animate-pulse rounded bg-neutral-800" />
        </div>
      </div>
    </main>
  );
}
```

`src/app/movie/[id]/not-found.tsx`:

```tsx
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
```

- [ ] **Step 6: Verificar**

```bash
npm test && npm run lint && npm run typecheck && npm run build
```

Esperado: tudo passa. Teste manual com `npm run dev`:
- `/movie/550?region=BR` mostra "Clube da Luta" (ou o título em pt-BR), com "Onde assistir", trailer e elenco.
- `/movie/abc` e `/movie/999999999` mostram "Filme não encontrado".
- "← Voltar" num filme aberto de `/?region=BR&provider=8&page=2` volta para essa mesma URL.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: página de detalhes do filme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Testes E2E com mock do TMDB

**Files:**
- Create: `playwright.config.ts`, `e2e/catalogo.spec.ts`, `e2e/mock-tmdb/server.mjs`, `e2e/mock-tmdb/fixtures/regions.json`, `e2e/mock-tmdb/fixtures/providers-BR.json`, `e2e/mock-tmdb/fixtures/providers-US.json`, `e2e/mock-tmdb/fixtures/movie-detail.json`
- Modify: `package.json` (script `test:e2e`), `.gitignore`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: o app completo das Tasks 5–7, e `TMDB_BASE_URL` e `TMDB_API_TOKEN` (Task 3).
- Produces: `npm run test:e2e`; mock do TMDB em `http://localhost:4010/3` que só aceita o token `e2e-token`; job `e2e` no CI.

O mock gera os filmes da busca: cada título vem no formato `Filme {região} {provider|todos} p{página} #{n}`, são 3 páginas, e `poster_path` e `logo_path` são `null`, para nenhuma imagem sair para a rede. O id `999` responde 404.

- [ ] **Step 1: Instalar o Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
npm pkg set scripts.test:e2e="playwright test"
printf '\n# playwright\n/test-results/\n/playwright-report/\n/playwright/.cache/\n' >> .gitignore
```

- [ ] **Step 2: Criar os fixtures**

`e2e/mock-tmdb/fixtures/regions.json`:

```json
{
  "results": [
    { "iso_3166_1": "BR", "english_name": "Brazil", "native_name": "Brasil" },
    { "iso_3166_1": "US", "english_name": "United States of America", "native_name": "Estados Unidos" }
  ]
}
```

`e2e/mock-tmdb/fixtures/providers-BR.json`:

```json
{
  "results": [
    { "provider_id": 8, "provider_name": "Netflix", "logo_path": null, "display_priority": 1, "display_priorities": { "BR": 1 } },
    { "provider_id": 119, "provider_name": "Amazon Prime Video", "logo_path": null, "display_priority": 2, "display_priorities": { "BR": 2 } },
    { "provider_id": 337, "provider_name": "Disney Plus", "logo_path": null, "display_priority": 3, "display_priorities": { "BR": 3 } }
  ]
}
```

`e2e/mock-tmdb/fixtures/providers-US.json`:

```json
{
  "results": [
    { "provider_id": 8, "provider_name": "Netflix", "logo_path": null, "display_priority": 1, "display_priorities": { "US": 1 } },
    { "provider_id": 15, "provider_name": "Hulu", "logo_path": null, "display_priority": 2, "display_priorities": { "US": 2 } }
  ]
}
```

`e2e/mock-tmdb/fixtures/movie-detail.json`:

```json
{
  "id": 550,
  "title": "Clube da Luta",
  "overview": "Um homem deprimido conhece um vendedor de sabão e juntos fundam um clube de luta.",
  "poster_path": null,
  "backdrop_path": null,
  "release_date": "1999-10-15",
  "runtime": 139,
  "vote_average": 8.4,
  "genres": [{ "id": 18, "name": "Drama" }],
  "credits": {
    "cast": [
      { "id": 819, "name": "Edward Norton", "character": "Narrador", "profile_path": null, "order": 0 },
      { "id": 287, "name": "Brad Pitt", "character": "Tyler Durden", "profile_path": null, "order": 1 }
    ]
  },
  "videos": {
    "results": [{ "key": "e2eTrailerKey", "site": "YouTube", "type": "Trailer", "iso_639_1": "pt" }]
  },
  "watch/providers": {
    "results": {
      "BR": {
        "link": "https://www.themoviedb.org/movie/550/watch?locale=BR",
        "flatrate": [{ "provider_id": 8, "provider_name": "Netflix", "logo_path": null }]
      },
      "US": {
        "link": "https://www.themoviedb.org/movie/550/watch?locale=US",
        "flatrate": [{ "provider_id": 15, "provider_name": "Hulu", "logo_path": null }]
      }
    }
  }
}
```

- [ ] **Step 3: Criar o servidor mock**

`e2e/mock-tmdb/server.mjs`:

```js
import http from "node:http";
import { readFileSync } from "node:fs";

const PORT = 4010;
const TOKEN = "e2e-token";
const TOTAL_PAGES = 3;
const PAGE_SIZE = 20;

function fixture(name) {
  try {
    return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
  } catch {
    return null;
  }
}

function discover(query) {
  const region = query.get("watch_region") ?? "BR";
  const provider = query.get("with_watch_providers") ?? "todos";
  const page = Number(query.get("page") ?? 1);
  const total = { total_pages: TOTAL_PAGES, total_results: TOTAL_PAGES * PAGE_SIZE };
  if (page > TOTAL_PAGES) return { page, results: [], ...total };
  const results = Array.from({ length: PAGE_SIZE }, (_, i) => ({
    id: page * 100 + i + 1,
    title: `Filme ${region} ${provider} p${page} #${i + 1}`,
    poster_path: null,
    release_date: "2024-05-10",
    vote_average: 7.5,
  }));
  return { page, results, ...total };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === "/health") return send(200, { ok: true });
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { status_message: "Invalid API key" });

  if (url.pathname === "/3/watch/providers/regions") return send(200, fixture("regions.json"));
  if (url.pathname === "/3/watch/providers/movie") {
    return send(200, fixture(`providers-${url.searchParams.get("watch_region")}.json`) ?? { results: [] });
  }
  if (url.pathname === "/3/discover/movie") return send(200, discover(url.searchParams));

  const movie = url.pathname.match(/^\/3\/movie\/(\d+)$/);
  if (movie) {
    if (movie[1] === "999") return send(404, { status_message: "The resource you requested could not be found." });
    return send(200, { ...fixture("movie-detail.json"), id: Number(movie[1]) });
  }

  send(404, { status_message: "not found" });
});

server.listen(PORT, () => console.log(`mock TMDB em http://localhost:${PORT}`));
```

- [ ] **Step 4: Configurar o Playwright**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${APP_PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-tmdb/server.mjs",
      port: 4010,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      port: APP_PORT,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: { TMDB_BASE_URL: "http://localhost:4010/3", TMDB_API_TOKEN: "e2e-token" },
    },
  ],
});
```

- [ ] **Step 5: Escrever os testes E2E**

`e2e/catalogo.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("fluxo principal: filtrar, trocar país, paginar e abrir detalhes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Filme BR todos p1 #1", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Netflix" }).click();
  await expect(page).toHaveURL(/\?region=BR&provider=8$/);
  await expect(page.getByRole("heading", { name: "Filme BR 8 p1 #1", exact: true })).toBeVisible();

  await page.getByLabel("País").selectOption("US");
  await expect(page).toHaveURL(/\?region=US$/);
  await expect(page.getByRole("heading", { name: "Filme US todos p1 #1", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hulu" })).toBeVisible();

  await page.getByRole("link", { name: "Próxima" }).click();
  await expect(page.getByText("Página 2 de 3")).toBeVisible();

  await page.getByRole("link", { name: /Filme US todos p2 #1\b/ }).click();
  await expect(page).toHaveURL(/\/movie\/201\?region=US&page=2$/);
  await expect(page.getByRole("heading", { level: 1, name: "Clube da Luta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Onde assistir" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hulu" })).toBeVisible();
  await expect(page.getByTitle("Trailer")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/e2eTrailerKey/);

  await page.getByRole("link", { name: "← Voltar" }).click();
  await expect(page).toHaveURL(/\?region=US&page=2$/);
});

test("página acima do total redireciona para a última", async ({ page }) => {
  await page.goto("/?region=BR&page=99");
  await expect(page).toHaveURL(/page=3$/);
  await expect(page.getByText("Página 3 de 3")).toBeVisible();
});

test("id inválido e filme inexistente mostram 'Filme não encontrado'", async ({ page }) => {
  await page.goto("/movie/abc");
  await expect(page.getByRole("heading", { name: "Filme não encontrado" })).toBeVisible();
  await page.goto("/movie/999");
  await expect(page.getByRole("heading", { name: "Filme não encontrado" })).toBeVisible();
});
```

- [ ] **Step 6: Rodar o E2E**

Run: `npm run test:e2e`
Esperado: 3 testes passando. Se algum falhar, investigue a causa com `npx playwright show-report` antes de mexer no teste; não afrouxe as asserções.

- [ ] **Step 7: Adicionar o job de E2E ao CI**

No fim de `.github/workflows/ci.yml`, dentro de `jobs:`, acrescente:

```yaml
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

- [ ] **Step 8: Verificar e fazer o commit**

```bash
npm test && npm run lint && npm run typecheck && npm run test:e2e
git add -A
git commit -m "test: E2E com Playwright e mock do TMDB

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: README, GitHub e deploy na Vercel

**Files:**
- Create: `README.md` (substitui o gerado pelo `create-next-app`)

**Interfaces:**
- Consumes: todo o app; os scripts `test`, `test:e2e`, `lint` e `typecheck`.
- Produces: repositório no GitHub com CI verde e app publicado na Vercel.

⚠️ Os passos 3 a 5 publicam coisas para fora da máquina (criam repositório e deploy). **Peça confirmação ao usuário antes de cada um**, incluindo o nome e a visibilidade do repositório.

- [ ] **Step 1: Escrever o README**

`README.md`:

````markdown
# Em cartaz no streaming

Catálogo dos filmes disponíveis agora nos streamings por assinatura, por país, usando a API do [TMDB](https://www.themoviedb.org/). Projeto do curso de Claude Code no YouTube.

## Rodando localmente

1. Crie uma conta no TMDB e copie o **API Read Access Token** em https://www.themoviedb.org/settings/api
2. `cp .env.example .env.local` e cole o token em `TMDB_API_TOKEN`
3. `npm install`
4. `npm run dev` e abra http://localhost:3000

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | testes E2E (Playwright, com mock do TMDB, sem token) |
| `npm run lint` / `npm run typecheck` | qualidade |

## Atribuição

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Dados de streaming fornecidos pela JustWatch.
````

- [ ] **Step 2: Fazer o commit**

```bash
git add README.md
git commit -m "docs: README com setup e scripts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Confirmar o CI do PR 6 e aguardar o merge autorizado pelo usuário**

O repositório já existe (criado após a Task 1). Rode `gh pr checks --watch`. Esperado: os jobs `check` e `e2e` ficam verdes. Depois que o usuário autorizar, faça o merge e siga na `main`.

- [ ] **Step 4: Ligar à Vercel (confirmar com o usuário)**

```bash
npx vercel link
npx vercel env add TMDB_API_TOKEN production
npx vercel env add TMDB_API_TOKEN preview
npx vercel git connect
```

Alternativa: importar o repositório pelo painel em https://vercel.com/new e adicionar `TMDB_API_TOKEN` em Settings → Environment Variables.

- [ ] **Step 5: Deploy de produção e verificação**

```bash
npx vercel --prod
```

Esperado: a URL de produção abre a grade do Brasil, os filtros funcionam, o detalhe abre e o rodapé mostra a atribuição do TMDB.
