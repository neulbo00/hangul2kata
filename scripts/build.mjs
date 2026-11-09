import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await cp("web", "dist", { recursive: true });
await cp("src", "dist/src", { recursive: true });
const appPath = "dist/app.js";
const app = await readFile(appPath, "utf8");
await writeFile(appPath, app.replaceAll("../src/", "./src/"));
console.log("Built static site into dist/");
