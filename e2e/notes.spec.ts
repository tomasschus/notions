import { test, expect } from "@playwright/test";

function noteIdFromUrl(url: string): string | null {
  const m = url.match(/\/notes\/([^/?#]+)/i);
  return m?.[1] ?? null;
}

test.describe("Notas (sin login, localStorage)", () => {
  test("al abrir / muestra mensaje o redirige a la primera nota", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);
    const content = await page.textContent("body");
    const hasLoading =
      content?.includes("Cargando") ||
      content?.includes("Seleccioná") ||
      content?.includes("Creá");
    const hasRedirect = page.url().includes("/notes/");
    expect(hasLoading || hasRedirect).toBeTruthy();
  });

  test("crear nota y ver editor", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    if (!page.url().includes("/notes/")) {
      await page.getByTestId("sidebar-new-note").click();
      await page.waitForURL(/\/notes\/[a-z0-9-]+/i, { timeout: 15000 });
    }
    await expect(page.locator('input[placeholder="Sin título"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("cambiar entre notas muestra el contenido correcto", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    if (!page.url().includes("/notes/")) {
      await page.getByTestId("sidebar-new-note").click();
      await page.waitForURL(/\/notes\//, { timeout: 15000 });
    }
    const titleInput = page.locator('input[placeholder="Sin título"]').first();
    await titleInput.waitFor({ state: "visible", timeout: 8000 });
    await titleInput.fill("Nota A");
    const idA = noteIdFromUrl(page.url());
    expect(idA).toBeTruthy();
    await page.waitForTimeout(1200);

    const urlBeforeSecond = page.url();
    await page.getByTestId("sidebar-new-note").click();
    await page.waitForURL(
      (u) => u.href !== urlBeforeSecond && u.href.includes("/notes/"),
      { timeout: 15000 }
    );
    const idB = noteIdFromUrl(page.url());
    expect(idB).toBeTruthy();
    expect(idB).not.toBe(idA);

    const titleInput2 = page.locator('input[placeholder="Sin título"]').first();
    await titleInput2.waitFor({ state: "visible", timeout: 5000 });
    await titleInput2.fill("Nota B");
    await page.waitForTimeout(1200);

    const sidebar = page.getByTestId("notes-sidebar");
    await sidebar.getByTestId(`note-row-${idA}`).click({ timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`/notes/${idA}(/|$)`), { timeout: 10000 });
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("Nota A", {
      timeout: 15000,
    });

    await sidebar.getByTestId(`note-row-${idB}`).click({ timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`/notes/${idB}(/|$)`), { timeout: 10000 });
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("Nota B", {
      timeout: 15000,
    });
  });
});

test.describe("Notas (con login, BD)", () => {
  const TEST_EMAIL = "e2e@test.com";
  const TEST_PASSWORD = "e2e-password-123";

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/(notes\/[a-z0-9-]+)?$/i, { timeout: 10000 });
    const listRes = await page.request.get("/api/notes");
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { id: string }[];
    for (const n of list) {
      const del = await page.request.delete(`/api/notes/${n.id}`);
      expect(del.ok()).toBeTruthy();
    }
  });

  test("después de login se ven notas o mensaje para crear", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    const hasNotesArea =
      body?.includes("Notas") ||
      body?.includes("Sincronizado") ||
      body?.includes("Creá") ||
      body?.includes("Sin resultados") ||
      page.url().includes("/notes/");
    expect(hasNotesArea).toBeTruthy();
  });

  test("crear nota con login y ver en editor", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.getByTestId("sidebar-new-note").click();
    await expect(page).toHaveURL(/\/notes\/[a-z0-9-]+/i, { timeout: 5000 });
    const titleInput = page.locator('input[placeholder="Sin título"]').first();
    await titleInput.waitFor({ state: "visible", timeout: 5000 });
    await titleInput.fill("Nota desde E2E");
    await expect(titleInput).toHaveValue("Nota desde E2E", { timeout: 15000 });
  });

  test("crear dos notas, cambiar entre ellas y ver títulos", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.getByTestId("sidebar-new-note").click();
    await page.waitForURL(/\/notes\//, { timeout: 15000 });
    await page.getByTestId("note-title-input").fill("BD Nota 1");
    await expect(page.getByTestId("note-title-input")).toHaveValue("BD Nota 1", {
      timeout: 5000,
    });
    const id1 = noteIdFromUrl(page.url());
    expect(id1).toBeTruthy();
    await expect(page.getByTestId(`note-row-${id1}`)).toContainText("BD Nota 1", {
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    const urlBeforeNote2 = page.url();
    await page.getByTestId("sidebar-new-note").click();
    await page.waitForURL(
      (u) => u.href !== urlBeforeNote2 && u.href.includes("/notes/"),
      { timeout: 15000 }
    );
    const id2 = noteIdFromUrl(page.url());
    expect(id2).toBeTruthy();
    expect(id2).not.toBe(id1);

    await page.locator('input[placeholder="Sin título"]').first().fill("BD Nota 2");
    await page.waitForTimeout(1200);

    const sidebar = page.getByTestId("notes-sidebar");
    await sidebar.getByTestId(`note-row-${id1}`).click({ timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`/notes/${id1}(/|$)`), { timeout: 10000 });
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("BD Nota 1", {
      timeout: 15000,
    });

    await sidebar.getByTestId(`note-row-${id2}`).click({ timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`/notes/${id2}(/|$)`), { timeout: 10000 });
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("BD Nota 2", {
      timeout: 15000,
    });
  });
});
