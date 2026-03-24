import { chromium } from 'playwright';

const SCREENSHOT_PATH = '.sisyphus/evidence/d2-keyboard-input.png';
const DEV_SERVER_URL = 'http://127.0.0.1:4173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' });

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('KeyK');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('KeyJ');

  await page.waitForTimeout(250);
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });

  await browser.close();
}

run();
