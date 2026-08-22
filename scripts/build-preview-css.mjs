import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "../tailwind.config.js";

const rootDir = process.cwd();
const inputPath = path.join(rootDir, "src", "index.css");
const outputPath = path.join(rootDir, ".granite-dist", "web", "assets", "preview-latest.css");

const css = await fs.readFile(inputPath, "utf8");
const result = await postcss([tailwindcss(tailwindConfig), autoprefixer]).process(css, {
  from: inputPath,
  to: outputPath,
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, result.css, "utf8");
console.log(`preview css built: ${outputPath}`);
