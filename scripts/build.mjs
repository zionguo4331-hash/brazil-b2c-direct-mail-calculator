import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of await readdir(publicDir)) {
  await cp(path.join(publicDir, entry), path.join(distDir, entry), { recursive: true });
}
await writeFile(path.join(distDir, ".nojekyll"), "", "utf8");
