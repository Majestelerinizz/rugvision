import fs from "fs";

const path = "src/js/data.js";
let s = fs.readFileSync(path, "utf8");
const map = {
  10: { sku: "RV-NARIN-010", widthCm: 80, lengthCm: 200 },
  9: { sku: "RV-LIVA-009", widthCm: 160, lengthCm: 230 },
  8: { sku: "RV-VERONA-008", widthCm: 200, lengthCm: 290 },
  7: { sku: "RV-ELARA-007", widthCm: 200, lengthCm: 300 },
  6: { sku: "RV-SAFIR-006", widthCm: 200, lengthCm: 300 },
  5: { sku: "RV-MIRA-005", widthCm: 160, lengthCm: 230 },
  4: { sku: "RV-NOVA-004", widthCm: 160, lengthCm: 230 },
  3: { sku: "RV-ARYA-003", widthCm: 200, lengthCm: 290 },
};

for (const [id, m] of Object.entries(map)) {
  const re = new RegExp(`(id: ${id},[\\s\\S]*?img: \`[^\`]+\`,)`);
  s = s.replace(re, (block) => {
    if (block.includes("sku:")) return block;
    return block.replace(
      /img: `([^`]+)`,/,
      (_mm, img) =>
        `sku: "${m.sku}",\n    widthCm: ${m.widthCm},\n    lengthCm: ${m.lengthCm},\n    glb: \`/models/${m.sku}.glb\`,\n    usdz: \`/models/${m.sku}.usdz\`,\n    img: \`${img}\`,`
    );
  });
}

fs.writeFileSync(path, s);
console.log("patched", path);
