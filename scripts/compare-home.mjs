import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("docs/verification", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const result = [];
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  for (const [name, port] of [
    ["original", 3001],
    ["migrated", Number(process.env.MIGRATED_PORT ?? 3000)],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (const img of document.images) {
        img.loading = "eager";
      }
      await Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: `docs/verification/home-${name}-${viewport.width}.png`,
      fullPage: true,
    });
    result.push({
      name,
      viewport,
      errors,
      layout: await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        hero: document.querySelector(".hero").getBoundingClientRect().toJSON(),
        heading: document.querySelector("h1").getBoundingClientRect().toJSON(),
        header: document
          .querySelector("header")
          .getBoundingClientRect()
          .toJSON(),
        sections: [...document.querySelectorAll("main section")].map((s) => ({
          class: s.className,
          rect: s.getBoundingClientRect().toJSON(),
        })),
      })),
    });
    await page.close();
  }
}
await browser.close();
await writeFile(
  "docs/verification/home-comparison.json",
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    result.map((r) => ({
      name: r.name,
      width: r.viewport.width,
      overflow: r.layout.width > r.viewport.width,
      errors: r.errors,
      heroHeight: r.layout.hero.height,
      heading: r.layout.heading,
    })),
    null,
    2,
  ),
);
