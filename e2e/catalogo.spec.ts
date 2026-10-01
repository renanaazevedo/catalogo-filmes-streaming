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
