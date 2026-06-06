const fs = require("fs");
const files = [
  "src/types.ts",
  "src/constants.ts",
  "src/presets.ts",
  "src/components/CrtCanvas.tsx",
  "src/components/ControlPanel.tsx",
  "src/components/MacroSliders.tsx"
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, "utf8");
    content = content.replace(/scanlineDensity/g, "scanlineAmount");
    fs.writeFileSync(f, content);
  }
}
