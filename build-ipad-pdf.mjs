import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const questionsPath = resolve("quiz-app/questions.js");
const archivePath = resolve("quiz-app/archive-questions.js");
const source = `${await readFile(archivePath, "utf8")}\n${await readFile(questionsPath, "utf8")}`;
const context = vm.createContext({});
vm.runInContext(`${source};globalThis.__QUESTIONS=QUESTIONS`, context);
const questions = context.__QUESTIONS;

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("&lt;sup&gt;", "<sup>")
    .replaceAll("&lt;/sup&gt;", "</sup>");

const label = (index) => String.fromCharCode(65 + index);
const answerText = (question) =>
  question.correct < 0 ? "题面异常，不计分" : label(question.correct);

const originalCount = questions.filter((question) => question.kind !== "extra").length;
const extraCount = questions.filter((question) => question.kind === "extra").length;
const mathCount = questions.filter((question) => question.subject === "数学").length;
const logicCount = questions.filter((question) => question.subject === "逻辑").length;

const questionBlocks = questions
  .map(
    (question) => `
      <article class="question" id="q-${question.id}">
        <header>
          <span class="number">${question.kind === "extra" ? "拓展题" : "第"} ${question.id}${question.kind === "extra" ? "" : " 题"}</span>
          <span class="tag">${escapeHtml(question.subject)}</span>
          <span class="tag muted">${escapeHtml(question.topic)}</span>
          <span class="tag warm">${question.kind === "extra" ? "拓展题" : "原题"}</span>
        </header>
        <div class="stem">${escapeHtml(question.stem)}</div>
        <ol class="options">
          ${question.options
            .map(
              (option, index) =>
                `<li><b>${label(index)}.</b> ${escapeHtml(option)}</li>`
            )
            .join("")}
        </ol>
      </article>
    `
  )
  .join("");

const answerBlocks = questions
  .map(
    (question) => `
      <article class="answer">
        <header>
          <span class="number">${question.kind === "extra" ? "拓展题" : "第"} ${question.id}${question.kind === "extra" ? "" : " 题"}</span>
          <span class="answer-key">${answerText(question)}</span>
        </header>
        <div class="explain">${escapeHtml(question.explanation)}</div>
        ${
          question.note
            ? `<div class="note">${escapeHtml(question.note)}</div>`
            : ""
        }
      </article>
    `
  )
  .join("");

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>分流考刷题 · iPad 可直接打开版</title>
    <style>
      @page { size: A4; margin: 14mm 14mm 16mm; }
      * { box-sizing: border-box; }
      html { color-scheme: light; }
      body {
        margin: 0;
        color: #15201d;
        background: #fff;
        font-family: "Microsoft YaHei UI", "PingFang SC", "Noto Sans CJK SC", sans-serif;
        font-size: 10.5pt;
        line-height: 1.65;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .cover {
        display: flex;
        min-height: 257mm;
        flex-direction: column;
        justify-content: space-between;
        padding: 12mm 0 4mm;
        page-break-after: always;
      }
      .cover-main { padding-top: 36mm; }
      .kicker {
        color: #b46219;
        font-size: 10pt;
        font-weight: 700;
        letter-spacing: .08em;
      }
      h1 {
        margin: 7mm 0 5mm;
        font-size: 30pt;
        line-height: 1.25;
      }
      .subtitle {
        max-width: 150mm;
        color: #59635f;
        font-size: 13pt;
      }
      .cover-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        margin-top: 18mm;
        border-top: 1px solid #b9b3a5;
        border-bottom: 1px solid #b9b3a5;
      }
      .cover-stats div { padding: 5mm 3mm; border-right: 1px solid #d9d5ca; }
      .cover-stats div:last-child { border-right: 0; }
      .cover-stats strong { display: block; font-size: 18pt; }
      .cover-stats span { color: #66706c; font-size: 9pt; }
      .notice {
        margin-top: 15mm;
        padding: 5mm;
        border-left: 4px solid #176b5d;
        background: #f5f7f3;
      }
      .notice p { margin: 0; }
      .cover-footer { color: #66706c; font-size: 9pt; }
      .section-title {
        margin: 0 0 8mm;
        padding: 5mm 0 3mm;
        border-bottom: 2px solid #176b5d;
        font-size: 22pt;
        page-break-after: avoid;
      }
      .question, .answer {
        margin: 0 0 7mm;
        padding: 4.5mm 5mm;
        border: 1px solid #d9d5ca;
        border-radius: 2mm;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .question header, .answer header {
        display: flex;
        align-items: center;
        gap: 2mm;
        margin-bottom: 3mm;
      }
      .number { margin-right: 1mm; font-weight: 800; }
      .tag {
        padding: .5mm 2mm;
        border-radius: 1mm;
        color: #0f5147;
        background: #e0eee9;
        font-size: 8pt;
      }
      .tag.muted { color: #53605c; background: #ebe9e2; }
      .tag.warm { color: #b46219; background: #f5e7d6; }
      .stem { margin-bottom: 3mm; font-weight: 650; }
      .options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5mm 7mm;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .options li { min-height: 7mm; }
      .answer-key {
        margin-left: auto;
        padding: 1mm 3mm;
        border-radius: 2mm;
        color: #fff;
        background: #176b5d;
        font-weight: 800;
      }
      .explain { color: #26332f; }
      .note {
        margin-top: 3mm;
        padding-top: 2.5mm;
        border-top: 1px solid #e3dfd5;
        color: #66706c;
        font-size: 9pt;
      }
      .page-break { page-break-before: always; }
      sup { font-size: .68em; line-height: 0; }
    </style>
  </head>
  <body>
    <section class="cover">
      <div class="cover-main">
        <div class="kicker">2025 上海交通大学平台预分专业能力测试</div>
        <h1>分流考刷题<br />数学与逻辑</h1>
        <p class="subtitle">iPad 可直接打开的静态刷题包，包含原卷回忆题、拓展题、答案与详细解析。</p>
        <div class="cover-stats">
          <div><strong>${questions.length}</strong><span>总题量</span></div>
          <div><strong>${originalCount}</strong><span>原卷回忆题</span></div>
          <div><strong>${extraCount}</strong><span>拓展题</span></div>
          <div><strong>${mathCount} / ${logicCount}</strong><span>数学 / 逻辑</span></div>
        </div>
        <div class="notice">
          <p>本文件不依赖网络、脚本或服务器，可用 iPad“文件”App直接打开，也可导入“图书”App阅读。</p>
          <p>前半部分为题目，后半部分为答案与解析。第 22、55 题原题面存在缺失或错误，已单独标注。</p>
        </div>
      </div>
      <div class="cover-footer">离线静态版 · 适用于 iPad / iPhone / macOS / Windows</div>
    </section>

    <section>
      <h2 class="section-title">第一部分 · 题目</h2>
      ${questionBlocks}
    </section>

    <section class="page-break">
      <h2 class="section-title">第二部分 · 答案与详细解析</h2>
      ${answerBlocks}
    </section>
  </body>
</html>`;

const outputPath = resolve("dist/ipad-print.html");
await writeFile(outputPath, html, "utf8");
console.log(outputPath);
