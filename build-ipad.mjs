import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("quiz-app");
const outputDir = resolve("dist");
const outputFile = resolve(outputDir, "分流考刷题-iPad.html");

const [html, styles, archiveQuestions, questions, app] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, "archive-questions.js"), "utf8"),
  readFile(resolve(root, "questions.js"), "utf8"),
  readFile(resolve(root, "app.js"), "utf8"),
]);

const inline = html
  .replace(
    '<link rel="stylesheet" href="styles.css" />',
    `<style>\n${styles}\n</style>`
  )
  .replace(
    '<script src="archive-questions.js"></script>\n    <script src="questions.js"></script>\n    <script src="app.js"></script>',
    `<script>\n${archiveQuestions}\n</script>\n    <script>\n${questions}\n</script>\n    <script>\n${app}\n</script>`
  );

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, inline, "utf8");
console.log(outputFile);
