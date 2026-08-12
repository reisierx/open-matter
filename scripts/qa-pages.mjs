import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8080";
await mkdir("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function shot(name, path, size = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport: size });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: false });
  const text = (await page.locator("body").innerText()).slice(0, 200);
  console.log(name, "ok", JSON.stringify(text.slice(0, 80)), "errors", errors.length);
  if (errors.length) console.log(errors.slice(0, 5));
  await page.close();
  return errors;
}

const all = [];
all.push(...(await shot("home-hero", "/")));
all.push(...(await shot("spec", "/spec")));
all.push(...(await shot("quickstart", "/quickstart")));
all.push(...(await shot("faq", "/faq")));
all.push(...(await shot("app", "/app")));
all.push(...(await shot("privacy", "/privacy")));
all.push(...(await shot("home-mobile", "/", { width: 390, height: 844 })));
all.push(...(await shot("app-mobile", "/app", { width: 390, height: 844 })));

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const raceErrors = [];
page.on("pageerror", (e) => raceErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") raceErrors.push(m.text());
});
await page.goto(base + "/", { waitUntil: "networkidle", timeout: 60000 });
const ask = page.getByRole("button", { name: /ask both desks/i });
await ask.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await ask.click();
await page.waitForTimeout(3200);
await page.screenshot({ path: "/workspace/screenshots/race.png" });
const raceText = await page.locator("body").innerText();
console.log("race done?", raceText.includes("preface saved"), "errors", raceErrors.length);
if (raceErrors.length) console.log(raceErrors.slice(0, 8));

const app = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const appErrors = [];
app.on("pageerror", (e) => appErrors.push(String(e)));
app.on("console", (m) => {
  if (m.type() === "error") appErrors.push(m.text());
});
await app.goto(base + "/app", { waitUntil: "networkidle", timeout: 60000 });
await app.getByRole("link", { name: /use the sample contract/i }).click();
await app.waitForTimeout(2500);
await app.screenshot({ path: "/workspace/screenshots/app-loaded.png" });
const appText = await app.locator("body").innerText();
console.log("app loaded?", appText.includes("Pages"), "errors", appErrors.length);
if (appErrors.length) console.log(appErrors.slice(0, 8));

await browser.close();
if (all.length + raceErrors.length + appErrors.length) {
  console.log("TOTAL_ERRORS", all.length + raceErrors.length + appErrors.length);
  process.exit(1);
}
console.log("QA clean");
