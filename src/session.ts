import { chromium, Page } from "playwright";

export async function createSession(url: string): Promise<Page> {
  const browser = await chromium.launch({
    args: ["--window-size=1366,768"],
    headless: process.env.HEADLESS === "true"
  });
  const activePage = await browser.newPage();
  if (!activePage) {
    throw new Error("No page found");
  }

  await activePage.goto(url);

  return activePage;
}
