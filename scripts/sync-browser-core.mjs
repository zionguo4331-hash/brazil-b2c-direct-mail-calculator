import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "lib", "calculateBrazilB2CDirectMailCost.js");
const targetDir = path.join(rootDir, "public");
const targetPath = path.join(targetDir, "calculator-core.js");
const sourceDefaultsPath = path.join(rootDir, "lib", "defaults.js");
const targetDefaultsPath = path.join(targetDir, "defaults.js");
const sourceEnginesDir = path.join(rootDir, "lib", "engines");
const targetEnginesDir = path.join(targetDir, "engines");

const source = await readFile(sourcePath, "utf8");
const sourceDefaults = await readFile(sourceDefaultsPath, "utf8");
const banner = "// Generated from lib/calculateBrazilB2CDirectMailCost.js\n";

await mkdir(targetDir, { recursive: true });
await rm(targetEnginesDir, { recursive: true, force: true });
await mkdir(targetEnginesDir, { recursive: true });
for (const entry of await readdir(sourceEnginesDir)) {
  await cp(path.join(sourceEnginesDir, entry), path.join(targetEnginesDir, entry), { force: true });
}
await writeFile(targetPath, `${banner}${source}`, "utf8");
await writeFile(targetDefaultsPath, `// Generated from lib/defaults.js\n${sourceDefaults}`, "utf8");
