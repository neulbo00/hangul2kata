import { execFileSync } from "node:child_process";

const blockedExtensions = new Set([".pdf", ".xlsx", ".xls", ".docx", ".doc"]);
const blockedSegments = new Set(["private", "lyrics", "answer-data", "final-cards", "reference-corpus"]);
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean);
const violations = tracked.filter((path) => {
  const parts = path.toLowerCase().split("/");
  const ext = path.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return blockedExtensions.has(ext) || parts.some(part => blockedSegments.has(part));
});
if (violations.length) {
  console.error("Potentially private files are tracked:");
  for (const path of violations) console.error(" - " + path);
  process.exitCode = 1;
} else {
  console.log(`Public-data path check passed (${tracked.length} tracked files).`);
}
