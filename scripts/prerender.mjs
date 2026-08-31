import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rendererSource = fs.readFileSync(path.join(projectRoot, "assets", "site.js"), "utf8");

const pages = [
  { page: "home", html: "index.html", data: "data/home.js" },
  { page: "cv", html: "cv/index.html", data: "data/cv.js" },
  { page: "research", html: "research/index.html", data: "data/research.js" },
  { page: "talks", html: "talks/index.html", data: "data/talks.js" }
];

const startMarker = "<!-- static-content:start -->";
const endMarker = "<!-- static-content:end -->";

function collectAssetVersions(directory, urlPrefix = "/assets") {
  const versions = new Map();

  function visit(currentDirectory, currentUrlPrefix) {
    fs.readdirSync(currentDirectory, { withFileTypes: true }).forEach((entry) => {
      const filePath = path.join(currentDirectory, entry.name);
      const assetUrl = `${currentUrlPrefix}/${entry.name}`;

      if (entry.isDirectory()) {
        visit(filePath, assetUrl);
        return;
      }

      if (entry.isFile()) {
        const digest = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").slice(0, 12);
        versions.set(assetUrl, digest);
      }
    });
  }

  visit(directory, urlPrefix);
  return versions;
}

const assetVersions = collectAssetVersions(path.join(projectRoot, "assets"));

function versionAssetReferences(html) {
  return html.replace(/((?:href|src)=")(\/assets\/[^"?#]+)(?:\?[^"#]*)?(\")/g, (match, prefix, assetUrl, suffix) => {
    const version = assetVersions.get(assetUrl);

    return version ? `${prefix}${assetUrl}?v=${version}${suffix}` : match;
  });
}

function renderPage(page) {
  const app = { innerHTML: "" };
  const context = {
    window: {},
    document: {
      body: { dataset: { page: page.page } },
      getElementById(id) {
        return id === "app" ? app : null;
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(projectRoot, page.data), "utf8"), context, {
    filename: page.data
  });
  vm.runInContext(rendererSource, context, { filename: "assets/site.js" });

  if (!app.innerHTML) {
    throw new Error(`Renderer produced no HTML for ${page.html}`);
  }

  const htmlPath = path.join(projectRoot, page.html);
  const htmlSource = fs.readFileSync(htmlPath, "utf8");
  const markerPattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);

  if (!markerPattern.test(htmlSource)) {
    throw new Error(`Static-content markers are missing from ${page.html}`);
  }

  const replacement = `${startMarker}\n        ${app.innerHTML}\n        ${endMarker}`;
  const prerenderedHtml = htmlSource.replace(markerPattern, replacement);
  fs.writeFileSync(htmlPath, versionAssetReferences(prerenderedHtml), "utf8");
  process.stdout.write(`Prerendered ${page.html}\n`);
}

pages.forEach(renderPage);
