import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalPages = ["index.html", "cv/index.html", "research/index.html", "talks/index.html"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function loadData(relativePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read(relativePath), context, { filename: relativePath });
  return context.window.sitePageData;
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

class FakeElement {
  constructor(attributes = {}, textContent = "") {
    this.attributes = new Map(Object.entries(attributes));
    this.textContent = textContent;
    this.value = "";
    this.hidden = false;
    this.focused = false;
    this.listeners = new Map();
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type) {
    (this.listeners.get(type) || []).forEach((listener) => listener.call(this));
  }

  click() {
    this.dispatch("click");
  }

  focus() {
    this.focused = true;
  }
}

function testPublicationExplorer(researchData) {
  const itemsByCategory = new Map();
  const publicationItems = [];

  researchData.categories.forEach((category) => {
    const categoryItems = category.items.map((item) => {
      const searchableText = [item.title, item.authors, item.venue, item.details, item.status]
        .filter(Boolean)
        .join(" ");
      const element = new FakeElement(
        {
          "data-publication-kind": category.key,
          "data-publication-subject": item.subject
        },
        searchableText
      );
      publicationItems.push(element);
      return element;
    });
    itemsByCategory.set(category.key, categoryItems);
  });

  const groups = researchData.categories.map((category) => {
    const group = new FakeElement({ "data-publication-group": category.key });
    group.querySelectorAll = (selector) => selector === "[data-publication-item]" ? itemsByCategory.get(category.key) : [];
    return group;
  });
  const typeButtons = ["all", ...researchData.categories.map((category) => category.key)].map(
    (key) => new FakeElement({ "data-publication-type-filter": key, "aria-pressed": key === "all" ? "true" : "false" })
  );
  const subjectButtons = ["all", ...researchData.subjects.map((subject) => subject.key)].map(
    (key) => new FakeElement({ "data-publication-subject-filter": key, "aria-pressed": key === "all" ? "true" : "false" })
  );
  const app = new FakeElement();
  const searchInput = new FakeElement();
  const resultCount = new FakeElement({}, `Showing ${publicationItems.length} publications`);
  const emptyState = new FakeElement();
  emptyState.hidden = true;
  const clearButton = new FakeElement();
  const publicationTools = new FakeElement();
  publicationTools.hidden = true;

  const document = {
    body: { dataset: { page: "research" } },
    getElementById(id) {
      return { app, "publication-search": searchInput, "publication-results": resultCount }[id] || null;
    },
    querySelectorAll(selector) {
      return {
        "[data-publication-item]": publicationItems,
        "[data-publication-group]": groups,
        "[data-publication-type-filter]": typeButtons,
        "[data-publication-subject-filter]": subjectButtons
      }[selector] || [];
    },
    querySelector(selector) {
      return {
        "[data-publication-empty]": emptyState,
        "[data-publication-clear]": clearButton,
        "[data-publication-tools]": publicationTools
      }[selector] || null;
    }
  };
  const context = { window: {}, document };
  vm.createContext(context);
  vm.runInContext(read("assets/site.js"), context, { filename: "assets/site.js" });

  function visibleCount() {
    return publicationItems.filter((item) => !item.hidden).length;
  }

  function buttonFor(buttons, attribute, key) {
    return buttons.find((button) => button.getAttribute(attribute) === key);
  }

  assert(!publicationTools.hidden, "Publication controls were not enabled by the browser script");

  const otherButton = buttonFor(subjectButtons, "data-publication-subject-filter", "other");
  otherButton.click();
  const expectedOther = researchData.categories.flatMap((category) => category.items).filter((item) => item.subject === "other").length;
  assert(visibleCount() === expectedOther, "Other-area filter returned the wrong publication count");

  const preprintButton = buttonFor(typeButtons, "data-publication-type-filter", "preprints");
  preprintButton.click();
  const expectedOtherPreprints = (itemsByCategory.get("preprints") || []).filter(
    (item) => item.getAttribute("data-publication-subject") === "other"
  ).length;
  assert(visibleCount() === expectedOtherPreprints, "Combined type and subject filters returned the wrong count");

  searchInput.value = "curved rum";
  searchInput.dispatch("input");
  assert(visibleCount() === 1 && resultCount.textContent === "Showing 1 publication", "Publication search did not find the rigidity manuscript");

  searchInput.value = "no publication should match this";
  searchInput.dispatch("input");
  assert(visibleCount() === 0 && !emptyState.hidden, "Empty publication-search state did not appear");

  clearButton.click();
  assert(visibleCount() === publicationItems.length, "Clear button did not restore every publication");
  assert(searchInput.value === "" && searchInput.focused, "Clear button did not reset and focus the search field");
  assert(groups.every((group) => !group.hidden), "Clear button did not restore every publication group");
  assert(typeButtons[0].getAttribute("aria-pressed") === "true", "Clear button did not reset the type filter state");
  assert(subjectButtons[0].getAttribute("aria-pressed") === "true", "Clear button did not reset the subject filter state");
}

function validateInternalReferences(relativePath, html) {
  const references = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map((match) => match[1]);

  references.forEach((reference) => {
    if (/^(?:https?:|mailto:|tel:)/.test(reference)) {
      return;
    }

    const cleanReference = reference.split("?")[0];
    let targetPath;

    if (cleanReference.startsWith("/")) {
      targetPath = cleanReference.slice(1);
    } else {
      targetPath = path.posix.join(path.posix.dirname(relativePath), cleanReference);
    }

    if (!targetPath || targetPath.endsWith("/")) {
      targetPath = path.posix.join(targetPath, "index.html");
    }

    assert(fs.existsSync(path.join(projectRoot, targetPath)), `${relativePath} references missing file ${cleanReference}`);
  });
}

const home = loadData("data/home.js");
const cv = loadData("data/cv.js");
const research = loadData("data/research.js");
const talks = loadData("data/talks.js");
const publications = research.categories.flatMap((category) =>
  category.items.map((item) => ({ ...item, kind: category.key }))
);
const subjectKeys = new Set(research.subjects.map((subject) => subject.key));
const categoryKeys = new Set(research.categories.map((category) => category.key));

assert(subjectKeys.size === research.subjects.length, "Publication subject keys must be unique");
assert(categoryKeys.size === research.categories.length, "Publication category keys must be unique");
assert(publications.length > 0, "Publication data must not be empty");
assert(new Set(publications.map((item) => item.title)).size === publications.length, "Publication titles must be unique");

publications.forEach((publication) => {
  ["title", "authors", "venue", "year", "subject", "kind"].forEach((field) => {
    assert(String(publication[field] || "").trim(), `Publication is missing ${field}: ${publication.title || "untitled"}`);
  });
  assert(subjectKeys.has(publication.subject), `Unknown subject ${publication.subject} on ${publication.title}`);
  (publication.links || []).forEach((link) => {
    assert(link.label && link.url, `Incomplete link on ${publication.title}`);
    assert(/^https:\/\//.test(link.url) || link.url.startsWith("/"), `Invalid or insecure link on ${publication.title}: ${link.url}`);
  });
});

const uniformPaper = publications.find((item) => item.title === "The uniform primary factorisation property for C(K, E)");
assert(uniformPaper?.authors === "A. Acuaviva and P. Acuaviva", "Uniform primary factorisation paper must list both authors");

const rigidityPaper = publications.find((item) => item.title === "Curved RUM spectra of periodic frameworks");
assert(rigidityPaper?.status === "Submitted", "Rigidity paper must be marked Submitted");

assert(!read("data/cv.js").includes("2408.10152"), "Web CV must not link the superseded robotics arXiv version");
assert(!["data/home.js", "data/cv.js", "data/research.js", "data/talks.js"].some((file) => read(file).includes("http://")), "Site data must not contain insecure HTTP links");
assert(/^(?:January|February|March|April|May|June|July|August|September|October|November|December) 20\d{2}$/.test(cv.profile.lastUpdated), "Web CV needs a month-and-year update date");
assert(!read("data/cv.js").includes("International Baccalaureate"), "Secondary-school details should remain compressed out of the main web CV");
assert(!read("data/cv.js").includes("JRF") && !read("data/cv.js").includes("Trinity"), "Web CV must not contain JRF application material");

const yfaw2026 = talks.items.find((talk) => talk.event === "Young Functional Analysts' Workshop 2026");
assert(yfaw2026?.eventUrl === "https://sites.google.com/site/yfawuk/yfaw-2026-in-cardiff", "YFAW 2026 must link to the Cardiff event page");

assert(!home.actions && !home.featuredPublications, "Homepage must not contain the declined CTA or selected-publications additions");
assert(!(home.links || []).some((link) => /lancaster/i.test(`${link.label} ${link.href}`)), "Homepage must not add a Lancaster profile link");

canonicalPages.forEach((relativePath) => {
  const html = read(relativePath);
  const assetReferences = [...html.matchAll(/(?:href|src)="(\/assets\/[^"#]+)"/g)].map((match) => match[1]);

  assert(html.includes('<a class="skip-link" href="#main-content">Skip to main content</a>'), `${relativePath} is missing its skip link`);
  assert(html.includes('<main id="main-content" class="page-shell" tabindex="-1">'), `${relativePath} is missing its main-content target`);
  assert(!/<script[^>]+src="\/data\//.test(html), `${relativePath} loads build data at runtime`);
  assetReferences.forEach((reference) => {
    assert(/\?v=[0-9a-f]{12}$/.test(reference), `${relativePath} has an unversioned asset: ${reference}`);
  });
  validateInternalReferences(relativePath, html);
});

assert(!read("index.html").includes("Selected publications"), "Homepage must not contain selected publications");
assert(!read("index.html").includes("Lancaster profile"), "Homepage must not contain a Lancaster profile link");
assert(!/<script[^>]+site\.js/.test(read("index.html")), "Homepage should not load the renderer at runtime");
assert(!/<script[^>]+site\.js/.test(read("cv/index.html")), "CV should not load the renderer at runtime");
assert(!/<script[^>]+site\.js/.test(read("talks/index.html")), "Talks should not load the renderer at runtime");
assert(/<script[^>]+src="\/assets\/site\.js\?v=[0-9a-f]{12}"/.test(read("research/index.html")), "Research must load the versioned enhancement script");

const researchHtml = read("research/index.html");
assert(countMatches(researchHtml, /data-publication-item(?:\s|>)/g) === publications.length, "Static publication count does not match the data");
assert(/class="publication-tools"[^>]*\shidden(?:\s|>)/.test(researchHtml), "Publication controls must stay hidden until JavaScript enhances them");
research.subjects.forEach((subject) => {
  assert(researchHtml.includes(`data-publication-subject-filter="${subject.key}"`), `Missing subject filter ${subject.key}`);
});
testPublicationExplorer(research);

const talksHtml = read("talks/index.html");
assert(countMatches(talksHtml, /<article class="talk">/g) === talks.items.length, "Static talk count does not match the data");
assert(!talksHtml.includes('<h3 class="talk__title">'), "Talk titles must not skip from h1 to h3");

const cvHtml = read("cv/index.html");
assert(cvHtml.includes("Research interests:"), "Research interests must appear near the top of the web CV");
assert(cvHtml.includes(`Last updated: ${cv.profile.lastUpdated}.`), "Web CV update date must match its data");
assert(cvHtml.includes("Earlier awards and scholarships"), "Older web-CV awards must remain available in a compact section");
assert(cvHtml.includes('<h4 class="entry__title">FUSRP:'), "Grouped CV entries must use a heading below their h3 subsection");

const css = read("assets/site.css");
assert(/\[hidden\]\s*\{\s*display:\s*none\s*!important;/.test(css), "CSS must enforce native hidden semantics");
assert(css.includes(".skip-link"), "CSS is missing skip-link styling");
assert(css.includes(":focus-visible"), "CSS is missing keyboard focus styling");

const sitemap = read("sitemap.xml");
["/", "/cv/", "/research/", "/talks/"].forEach((route) => {
  assert(sitemap.includes(`https://ahacua.github.io${route}`), `Sitemap is missing ${route}`);
});

process.stdout.write(`Validated ${canonicalPages.length} pages, ${publications.length} publications, and ${talks.items.length} talks.\n`);
