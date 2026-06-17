#!/usr/bin/env node
/**
 * Genis cihaz matrisi AR kabul raporu (CSV + HTML).
 *
 *   npm run reports:device-matrix
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateDeviceMatrix, DEVICE_MATRIX } from "../lib/device-matrix.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "reports");

function stamp() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main() {
  const summary = evaluateDeviceMatrix(DEVICE_MATRIX);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const date = stamp();
    const base = `device-matrix-ar-${summary.total}-devices-${date}`;
    const csvPath = path.join(OUT_DIR, `${base}.csv`);
    const htmlPath = path.join(OUT_DIR, `${base}.html`);

    const header = [
      "id",
      "label",
      "brand",
      "model",
      "browser",
      "expected_primary",
      "actual_primary",
      "expected_widget",
      "actual_widget",
      "supports_native_ar",
      "scene_viewer_intent",
      "pilot_verified",
      "status",
      "note",
    ];

    const rows = summary.results.map((r) => [
      r.entry.id,
      r.entry.label,
      r.entry.brand,
      r.entry.model,
      r.entry.browser,
      r.entry.expectedPrimary,
      r.actualPrimary,
      r.entry.expectedWidgetAction,
      r.actualWidgetAction,
      r.actualSupportsNativeAr ? "yes" : "no",
      r.usesSceneViewerIntent ? "yes" : "no",
      r.entry.pilotVerified ? "yes" : "no",
      r.pass ? "PASS" : "FAIL",
      r.entry.note || "",
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    fs.writeFileSync(csvPath, csv, "utf8");

    const passCount = summary.passed;
    const failCount = summary.failed;
    const tableRows = summary.results
      .map(
        (r) =>
          `<tr class="${r.pass ? "pass" : "fail"}">
            <td>${esc(r.entry.label)}</td>
            <td>${esc(r.entry.brand)}</td>
            <td>${esc(r.entry.model)}</td>
            <td>${esc(r.entry.browser)}</td>
            <td>${esc(r.entry.expectedWidgetAction)}</td>
            <td>${esc(r.actualWidgetAction)}</td>
            <td>${r.actualSupportsNativeAr ? "Evet" : "Hayir"}</td>
            <td>${r.entry.pilotVerified ? "Evet" : "-"}</td>
            <td><strong>${r.pass ? "PASS" : "FAIL"}</strong></td>
            <td>${esc(r.entry.note || "")}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <title>RugVision Cihaz Matrisi AR Raporu</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #18181b; }
    h1 { font-size: 1.35rem; }
    .meta { color: #52525b; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #e4e4e7; padding: 8px 10px; text-align: left; }
    th { background: #f4f4f5; }
    tr.pass td:nth-child(9) { color: #166534; }
    tr.fail td:nth-child(9) { color: #991b1b; }
    .summary { margin: 16px 0; padding: 12px 16px; background: #f0fdf4; border-radius: 8px; }
    .summary.fail { background: #fef2f2; }
  </style>
</head>
<body>
  <h1>RugVision — Genis Cihaz Matrisi AR Raporu</h1>
  <p class="meta">Tarih: ${new Date().toISOString().slice(0, 10)} · ${summary.total} cihaz/tarayici kombinasyonu</p>
  <div class="summary${failCount ? " fail" : ""}">
    <strong>${passCount}/${summary.total} PASS</strong>
    ${failCount ? ` — ${failCount} FAIL` : " — tum kombinasyonlar beklenen AR yoluna yonleniyor"}
  </div>
  <table>
    <thead>
      <tr>
        <th>Cihaz</th><th>Marka</th><th>Model</th><th>Tarayici</th>
        <th>Beklenen widget</th><th>Gercek widget</th><th>Native AR</th>
        <th>Pilot</th><th>Durum</th><th>Not</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <p class="meta" style="margin-top:24px">Yazdir → PDF veya CSV: ${path.basename(csvPath)}</p>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html, "utf8");

    console.log(`Device matrix: ${passCount}/${summary.total} PASS`);
    console.log(`CSV:  ${csvPath}`);
    console.log(`HTML: ${htmlPath}`);

    if (!summary.allPass) process.exit(1);
}

main();
