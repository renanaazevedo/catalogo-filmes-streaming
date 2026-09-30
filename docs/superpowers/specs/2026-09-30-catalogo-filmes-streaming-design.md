# Catálogo de Filmes em Streaming — Design

**Data:** 2026-09-30
**Status:** aprovado em conversa, aguardando revisão da spec

## 1. Objetivo e contexto

App web que mostra os filmes disponíveis **agora** nos streamings por assinatura de um país, usando a API do TMDB.

É um **projeto de demonstração para um curso de Claude Code no YouTube**. Por isso:

- o código deve ser didático, enxuto e dividido em etapas que caibam em episódios;
- o curso mostra, além do app, TDD, Git/GitHub com PRs e deploy na Vercel.

### Critérios de sucesso

- A home lista filmes disponíveis por assinatura no país escolhido (padrão: Brasil), com paginação.
- É possível filtrar por um streaming e trocar de país.
- Cada filme tem uma página de detalhes com sinopse, elenco, trailer e onde assistir.
- O token do TMDB nunca é exposto ao navegador.
- Os testes unitários e E2E passam no CI, e o app está publicado na Vercel.

## 2. Escopo

**Dentro:**

1. Grade de filmes com paginação.
2. Filtro por streaming (seleção única).
3. Seletor de país (padrão BR).
4. Página de detalhes do filme.

**Fora (YAGNI):** busca, filtro por gênero, ordenação configurável, favoritos, séries, seletor de idioma, tema alternável, seleção múltipla de streamings, scroll infinito.

## 3. Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Vitest + Testing Library (unitários), Playwright (E2E)
- GitHub + GitHub Actions (CI), Vercel (deploy)

## 4. Arquitetura

Abordagem: **React Server Components com os filtros na URL**. Não há API routes nem banco de dados. O TMDB é chamado apenas no servidor.

### 4.1 Autenticação

- Token de leitura v4 do TMDB (Bearer) em `TMDB_API_TOKEN` (`.env.local`), lido só no servidor.
- `.env.example` versionado; `.env.local` no `.gitignore`.
- Se o token estiver ausente, o app falha com a mensagem: "configure TMDB_API_TOKEN no .env.local".

### 4.2 Endpoints do TMDB

| Uso | Endpoint |
|---|---|
| Grade | `GET /3/discover/movie?watch_region={R}&with_watch_monetization_types=flatrate&with_watch_providers={P}&language=pt-BR&sort_by=popularity.desc&page={N}` (`with_watch_providers` só é enviado quando há streaming selecionado) |
| Streamings do país | `GET /3/watch/providers/movie?watch_region={R}&language=pt-BR` |
| Países | `GET /3/watch/providers/regions?language=pt-BR` |
| Detalhes | `GET /3/movie/{id}?language=pt-BR&append_to_response=credits,videos,watch/providers` |

- **Regra de negócio:** "disponível no streaming" significa monetização `flatrate` (assinatura) no país. Aluguel e compra ficam de fora.
- Sem streaming selecionado, a grade mostra filmes de qualquer streaming por assinatura do país.
- Idioma fixo em `pt-BR`. Os vídeos são pedidos com `include_video_language=pt,en` para haver trailer mesmo sem versão em português.
- Cache: `fetch` com `next: { revalidate: 21600 }` (6h).

### 4.3 Fluxo de dados

1. O usuário acessa `/?region=BR&provider=8&page=1`.
2. `app/page.tsx` (Server Component) valida os parâmetros com `lib/search-params.ts`.
3. A página busca em paralelo (`Promise.all`) os filmes, os streamings do país e os países.
4. O HTML é renderizado no servidor. Os filtros são componentes cliente que só atualizam a URL (`router.push`), e o Next renderiza a página de novo.
5. O card leva a `/movie/[id]?region=R`, que busca os detalhes e mostra os streamings flatrate do país `R`.

### 4.4 Estrutura de pastas

```
src/
  app/
    layout.tsx               # layout + rodapé com atribuição TMDB
    page.tsx                 # home
    loading.tsx, error.tsx
    movie/[id]/
      page.tsx, loading.tsx, not-found.tsx
  components/
    MovieGrid.tsx, MovieCard.tsx, Pagination.tsx
    ProviderFilter.tsx (client), RegionSelect.tsx (client)
    WatchProviders.tsx, Trailer.tsx, CastList.tsx
  lib/
    search-params.ts         # parse/validação de region, provider, page
    tmdb/
      client.ts              # tmdbFetch: base URL, auth, cache, TmdbError
      movies.ts              # discoverMovies, getMovieDetails
      providers.ts           # getProviders, getRegions
      details.ts             # pickTrailer, topCast, flatrateProviders (funções puras)
      images.ts              # posterUrl, backdropUrl, logoUrl, profileUrl
      types.ts
tests/e2e/                   # Playwright + fixtures JSON
```

Cada unidade tem uma responsabilidade: `client.ts` só sabe fazer requisições autenticadas; `movies.ts` e `providers.ts` montam os parâmetros e tipam as respostas; `details.ts` contém a lógica pura de seleção; os componentes só renderizam.

## 5. Telas

### 5.1 Home (`/`)

- **Cabeçalho:** nome do app e `RegionSelect`, um `<select>` nativo com os países em ordem alfabética (nomes em pt-BR). Trocar o país remove `provider` e volta para `page=1`.
- **ProviderFilter:** fileira rolável com os logos dos streamings do país, ordenados por `display_priority` e limitados aos 20 primeiros. A seleção é única: clicar seleciona, clicar no selecionado limpa o filtro. Trocar o streaming volta para `page=1`.
- **MovieGrid:** 2, 3, 4 ou 6 colunas conforme o breakpoint. O `MovieCard` mostra o pôster (`next/image`, `image.tmdb.org` em `remotePatterns`), o título, o ano e a nota (1 casa decimal). O card inteiro é um link.
- **Pagination:** "Anterior" e "Próxima", mais "Página X de Y", com `Y = min(total_pages, 500)`.

### 5.2 Detalhes (`/movie/[id]?region=R`)

- Backdrop, pôster, título, ano, duração (formato "2h 10min"), gêneros e sinopse.
- **Onde assistir:** logos dos streamings flatrate do país `R`, com o `link` da resposta do TMDB e o crédito "Dados de JustWatch".
- **Trailer:** o primeiro vídeo com `site=YouTube` e `type=Trailer` (preferindo pt, depois en), incorporado via `youtube-nocookie.com`. Se não houver trailer, a seção não aparece.
- **Elenco:** os 10 primeiros por `order`, com foto e personagem.
- "← Voltar" retorna para a home preservando `region` (e os demais filtros, via histórico).

### 5.3 Atribuição

O rodapé mostra o logo do TMDB e o aviso "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."

## 6. Erros e estados

- **`TmdbError`:** qualquer resposta que não seja 2xx gera um erro com `status` e `message`. Um 404 em detalhes chama `notFound()`. Não há retry.
- **Parâmetros inválidos:**
  - `region` que não está na lista de países vira `BR`;
  - `page` que não é inteiro entre 1 e 500 vira `1`;
  - `provider` que não é inteiro positivo é ignorado;
  - `page > total_pages` (com `total_pages ≥ 1`) redireciona para a última página válida.
- **Carregando:** `loading.tsx` com skeletons na home e no detalhe.
- **Erro:** `error.tsx` com "Não foi possível carregar os filmes" e o botão "Tentar de novo" (`reset()`).
- **Grade vazia:** "Nenhum filme encontrado para este streaming neste país", com um link para limpar o filtro.
- **Imagem ausente:** placeholder neutro com o título do filme ou o nome da pessoa.
- **Sem streaming no país:** "Indisponível em streaming por assinatura neste país."

## 7. Testes

**Unitários (Vitest), escritos com TDD:**

- `search-params`: valores válidos, inválidos e limites (0, 1, 500, 501, "abc", região desconhecida).
- `tmdb/client`: header `Authorization`, base URL, erro de token ausente, `TmdbError` em 401, 404 e 500.
- `tmdb/movies` e `tmdb/providers` (com `fetch` mockado): parâmetros montados corretamente, incluindo a ausência de `with_watch_providers` quando não há filtro.
- `tmdb/details`: `pickTrailer`, `topCast` e `flatrateProviders` (país sem dados retorna lista vazia).
- `tmdb/images`: URLs e `null` para caminho ausente.
- Componentes: `MovieCard` com e sem pôster, `Pagination` na primeira e na última página.

**E2E (Playwright):** as respostas do TMDB são servidas por fixtures JSON, sem rede real e sem token no CI. O fluxo é: home → filtrar streaming → trocar país (o filtro é resetado) → página 2 → abrir filme → ver "Onde assistir" e o trailer.

Como as chamadas ao TMDB acontecem no servidor, o `page.route` do Playwright não as intercepta. Por isso, `TMDB_BASE_URL` é configurável (padrão `https://api.themoviedb.org/3`) e, no E2E, aponta para um pequeno servidor mock local que devolve os fixtures.

## 8. Git, CI e deploy

- Repositório Git com a branch `main`. Cada funcionalidade vai numa branch com PR, e os commits seguem o padrão convencional.
- GitHub Actions no PR e em `main`: `lint`, `typecheck`, `vitest` e `playwright`.
- Vercel conectada ao repositório, com `TMDB_API_TOKEN` nas variáveis de ambiente. Cada PR ganha um preview e a `main` vai para produção.

## 9. Ordem de implementação (episódios)

1. Setup: Next.js, Tailwind, Vitest, Playwright e CI.
2. Cliente do TMDB e `search-params` com TDD.
3. Home: grade e paginação.
4. Filtros de streaming e país.
5. Página de detalhes.
6. Estados de erro e vazio, E2E completo e deploy na Vercel.
