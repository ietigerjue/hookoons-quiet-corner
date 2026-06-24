import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const templatePath = path.join(repoRoot, "scripts", "og-image-template.html");
const outputPath = path.join(repoRoot, "public", "images", "og-default.png");

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Try Edge (full known paths), then CLI aliases
const browsers = [
  '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"',
  '"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"',
  "msedge",
  "chrome",
  "chromium",
];

const templateUrl = `file:///${templatePath.replace(/\\/g, "/")}`;
const posixOutput = outputPath.replace(/\\/g, "/");

let success = false;
for (const browserExe of browsers) {
  try {
    const cmd = `${browserExe} --headless=new --window-size=1200,630 --screenshot="${posixOutput}" "${templateUrl}"`;
    console.log(`Trying: ${browserExe.replace(/"/g, "")}...`);
    execSync(cmd, { stdio: "pipe", timeout: 15000 });
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      console.log(`OG default image generated: ${outputPath}`);
      success = true;
      break;
    }
  } catch {
    // try next browser
  }
}

if (!success) {
  console.warn(
    "Warning: Could not generate OG default image (no headless browser found).\n" +
      "The RSS feed and sitemap were still generated successfully.\n" +
      "To generate the OG image manually, open scripts/og-image-template.html in a browser\n" +
      "and take a 1200x630 screenshot saved to public/images/og-default.png",
  );
}
