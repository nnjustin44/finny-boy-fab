import { expect, test } from '@playwright/test';

const routes = [
  '/', '/shop', '/products/generic-end-grain-cutting-board', '/cart', '/contact',
  '/custom-inquiry', '/learn', '/about', '/terms', '/privacy', '/cookies'
];
const origin = 'http://127.0.0.1:18080';

test('public routes render without broken images or horizontal overflow', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  for (const route of routes) {
    const response = await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(response?.status(), route).toBe(200);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('h1').first()).toBeVisible();
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(layout.scrollWidth, route).toBeLessThanOrEqual(layout.clientWidth);
    const imageSources = await page.locator('img').evaluateAll(images => images
      .map(image => image.getAttribute('src'))
      .filter((source): source is string => Boolean(source)));
    for (const source of new Set(imageSources)) {
      const imageResponse = await page.request.get(source);
      expect(imageResponse.status(), `${route}: ${source}`).toBe(200);
    }
  }
  expect(pageErrors).toEqual([]);
});

test('browsing does not allocate a server cart', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => localStorage.getItem('finnyboyfab.cartId'))).toBeNull();
});

test('production checkout is fail-closed and support contact is visible', async ({ page }) => {
  await page.goto('/contact');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('link', { name: 'deployment-test@example.com' })).toBeVisible();

  const settings = await page.request.get('/api/storefront');
  expect(settings.ok()).toBeTruthy();
  expect(await settings.json()).toMatchObject({ checkoutEnabled: false });
});

test('return and warranty terms are visible before purchase', async ({ page }) => {
  await page.goto('/products/generic-end-grain-cutting-board');
  await expect(page.getByText('14-day returns, no reason required.')).toBeVisible();

  await page.getByRole('link', { name: 'Read the full policy.' }).click();
  await expect(page.getByRole('heading', { name: '14-day returns' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One-year deformation warranty' })).toBeVisible();
  await expect(page.getByText('This limited warranty is void if the board is placed in a dishwasher.')).toBeVisible();
});

test('cart remove control is separate from the quantity control', async ({ page }) => {
  await page.goto('/products/generic-end-grain-cutting-board');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('.cart-line-controls').first()).toBeVisible();

  const drawerControls = page.locator('.cart-line-controls').first();
  await expect(drawerControls.locator(':scope > .quantity-row')).toBeVisible();
  await expect(drawerControls.locator(':scope > .trash-button')).toBeVisible();
  await expect(drawerControls.locator('.quantity-row .trash-button')).toHaveCount(0);

  await page.goto('/cart');
  const pageControls = page.locator('.cart-page-line .cart-line-controls').first();
  await expect(pageControls.locator(':scope > .quantity-row')).toBeVisible();
  await expect(pageControls.locator(':scope > .trash-button')).toBeVisible();
  await expect(page.getByText("Card, shipping, and tax details are entered securely on Stripe's payment page.")).toBeVisible();
});

test('API mutations require the storefront origin', async ({ request }) => {
  const blocked = await request.post('/api/cart', { headers: { Origin: 'https://attacker.example' } });
  expect(blocked.status()).toBe(403);

  const allowed = await request.post('/api/cart', { headers: { Origin: origin } });
  expect(allowed.status()).toBe(200);
});

test('unknown browser routes use the branded 404 response', async ({ page }) => {
  const response = await page.goto('/not-a-real-page');
  await page.waitForLoadState('networkidle');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'That page is not in the shop.' })).toBeVisible();
});
