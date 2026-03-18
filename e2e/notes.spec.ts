import { test, expect } from "@playwright/test";

test.describe("Notas (sin login, localStorage)", () => {
  test("al abrir / muestra mensaje o redirige a la primera nota", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);
    // Puede mostrar "Cargando…", "Seleccioná o creá una nota" o redirigir a /notes/...
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
    await page.waitForTimeout(800);

    await page.getByTestId("sidebar-new-note").click();
    await page.waitForURL(/\/notes\//, { timeout: 15000 });
    const titleInput2 = page.locator('input[placeholder="Sin título"]').first();
    await titleInput2.waitFor({ state: "visible", timeout: 5000 });
    await titleInput2.fill("Nota B");
    await page.waitForTimeout(800);

    await page.getByText("Nota A", { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("Nota A");

    await page.getByText("Nota B", { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("Nota B");
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
    await page.waitForTimeout(600);
    await expect(titleInput).toHaveValue("Nota desde E2E");
  });

  test("crear dos notas, cambiar entre ellas y ver títulos", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.getByTestId("sidebar-new-note").click();
    await page.waitForURL(/\/notes\//, { timeout: 15000 });
    await page.locator('input[placeholder="Sin título"]').first().fill("BD Nota 1");
    await page.waitForTimeout(800);

    await page.getByTestId("sidebar-new-note").click();
    await page.waitForURL(/\/notes\//, { timeout: 15000 });
    await page.locator('input[placeholder="Sin título"]').first().fill("BD Nota 2");
    await page.waitForTimeout(800);

    await page.getByText("BD Nota 1", { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("BD Nota 1");

    await page.getByText("BD Nota 2", { exact: true }).first().click({ timeout: 15000 });
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Sin título"]').first()).toHaveValue("BD Nota 2");
  });
});
