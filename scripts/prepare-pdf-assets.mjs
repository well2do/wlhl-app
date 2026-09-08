import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("pdfjs-dist/package.json"));
const { version } = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const assetRoot = fileURLToPath(new URL("../public/pdfread-assets/", import.meta.url));
const destination = join(assetRoot, version);

await rm(assetRoot, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await Promise.all([
  cp(join(packageRoot, "build/pdf.worker.min.mjs"), join(destination, "pdf.worker.min.mjs")),
  cp(join(packageRoot, "LICENSE"), join(destination, "LICENSE")),
  ...["cmaps", "standard_fonts", "wasm", "iccs"].map((directory) =>
    cp(join(packageRoot, directory), join(destination, directory), { recursive: true }),
  ),
]);
console.log(`Prepared PDFRead assets for PDF.js ${version}.`);
