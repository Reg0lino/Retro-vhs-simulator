const fs = require("fs");
const file = "src/presets.ts";

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, "utf8");
  // Add scanlineDensity: 1.0 right after scanlineAmount matches
  content = content.replace(/(scanlineAmount:\s*\d+,)/g, "$1\n      scanlineDensity: 1.0,");
  fs.writeFileSync(file, content);
}
