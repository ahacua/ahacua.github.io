import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalPages = ["index.html", "cv/index.html", "research/index.html", "talks/index.html", "timeline/index.html"];

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
  if (relativePath === "data/timeline.js") {
    context.window.siteTimelineSources = Object.fromEntries(
      ["cv", "talks", "research"].map((name) => [name, loadData(`data/${name}.js`)])
    );
  }
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

  buttonFor(typeButtons, "data-publication-type-filter", "journals").click();
  searchInput.value = "curved rum";
  searchInput.dispatch("input");
  assert(visibleCount() === 1 && resultCount.textContent === "Showing 1 publication", "Publication search did not find the rigidity article");

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
const timeline = loadData("data/timeline.js");
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
assert(rigidityPaper?.kind === "journals" && rigidityPaper?.venue === "Bulletin of the London Mathematical Society", "Rigidity paper must show its published journal venue");

const unconditionalBasesPaper = publications.find((item) => item.title === "A negative solution to the complemented subspace problem for Banach spaces with unconditional bases");
assert(unconditionalBasesPaper?.links?.some((link) => link.url === "https://arxiv.org/abs/2609.08921"), "Latest unconditional-bases preprint is missing its arXiv link");

research.categories.forEach((category) => {
  const years = category.items.map((item) => Number(item.year));
  assert(years.every((year, index) => index === 0 || year <= years[index - 1]), `${category.title} must be in reverse chronological order`);
});
assert(!publications.some((publication) => (publication.links || []).some((link) => link.label === "Journal version")), "Published-paper links must use the concise Article label");

assert(!read("data/cv.js").includes("2408.10152"), "Web CV must not link the superseded robotics arXiv version");
assert(!["data/home.js", "data/cv.js", "data/research.js", "data/talks.js", "data/timeline.js"].some((file) => read(file).includes("http://")), "Site data must not contain insecure HTTP links");
assert(/^(?:January|February|March|April|May|June|July|August|September|October|November|December) 20\d{2}$/.test(cv.profile.lastUpdated), "Web CV needs a month-and-year update date");
assert(!read("data/cv.js").includes("International Baccalaureate"), "Secondary-school details should remain compressed out of the main web CV");
assert(!read("data/cv.js").includes("JRF") && !read("data/cv.js").includes("Trinity"), "Web CV must not contain JRF application material");

const yfaw2026 = talks.items.find((talk) => talk.event === "Young Functional Analysts' Workshop 2026");
assert(yfaw2026?.eventUrl === "https://sites.google.com/site/yfawuk/yfaw-2026-in-cardiff", "YFAW 2026 must link to the Cardiff event page");
talks.items.forEach((talk) => {
  assert(!talk.note, `Talk ${talk.title} has a redundant talk-type note`);
  (talk.links || []).forEach((link) => {
    assert(!/journal|article|arxiv|preprint|paper|publication/i.test(link.label), `Talk ${talk.title} must not link to an article or preprint`);
  });
});

assert(!home.actions && !home.featuredPublications, "Homepage must not contain the declined CTA or selected-publications additions");
assert(!(home.links || []).some((link) => /lancaster/i.test(`${link.label} ${link.href}`)), "Homepage must not add a Lancaster profile link");
assert(!read("data/home.js").includes("dual degree"), "Homepage biography must describe the Mathematics and Physics degrees separately");

canonicalPages.forEach((relativePath) => {
  const html = read(relativePath);
  const assetReferences = [...html.matchAll(/(?:href|src)="(\/assets\/[^"#]+)"/g)].map((match) => match[1]);

  assert(html.includes('<a class="skip-link" href="#main-content">Skip to main content</a>'), `${relativePath} is missing its skip link`);
  assert(html.includes('<main id="main-content" class="page-shell" tabindex="-1">'), `${relativePath} is missing its main-content target`);
  assert(html.includes('<footer class="site-footer">'), `${relativePath} is missing its footer`);
  assert(html.includes('data-theme-toggle'), `${relativePath} is missing its theme toggle`);
  assert(/<nav class="site-nav"[\s\S]*?<a href="\/timeline\/"/.test(html), `${relativePath} is missing Timeline in the primary navigation`);
  assert(/<script[^>]+src="\/assets\/theme\.js\?v=[0-9a-f]{12}"/.test(html), `${relativePath} is missing the versioned theme script`);
  assert(html.indexOf('antonio-acuaviva-theme') < html.indexOf('/assets/site.css'), `${relativePath} must initialise the theme before loading CSS`);
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
assert(!/publication__authors[^>]*>[^<]*<strong/.test(researchHtml), "Publication author names must use equal visual weight");
assert(/class="publication-tools"[^>]*\shidden(?:\s|>)/.test(researchHtml), "Publication controls must stay hidden until JavaScript enhances them");
research.subjects.forEach((subject) => {
  assert(researchHtml.includes(`data-publication-subject-filter="${subject.key}"`), `Missing subject filter ${subject.key}`);
});
testPublicationExplorer(research);

// Exercise filtering against mixed talk/attendance entries and hidden year groups.
function testTimelineFilters() {
  const items = timeline.items.map((item) => new FakeElement({
    "data-timeline-categories": [item.category, ...(item.alsoCategories || [])].join(" ")
  }));
  const groupKeys = [...new Set(timeline.items.map((item) => item.status === "forthcoming" ? "forthcoming" : item.start.slice(0, 4)))];
  const groups = groupKeys.map((key) => {
    const group = new FakeElement();
    group.querySelectorAll = () => items.filter((_, index) =>
      (timeline.items[index].status === "forthcoming" ? "forthcoming" : timeline.items[index].start.slice(0, 4)) === key
    );
    return group;
  });
  const buttons = ["all", ...timeline.categories.map((category) => category.key)].map((key) => new FakeElement({
    "data-timeline-filter": key,
    "aria-pressed": key === "all" ? "true" : "false"
  }, key));
  const tools = new FakeElement();
  tools.hidden = true;
  const results = new FakeElement();
  const select = new FakeElement();
  select.value = "all";
  const app = new FakeElement();
  const document = {
    body: { dataset: { page: "timeline" } },
    getElementById(id) { return { app, "timeline-results": results, "timeline-category": select }[id] || null; },
    querySelector(selector) { return selector === "[data-timeline-tools]" ? tools : null; },
    querySelectorAll(selector) {
      return { "[data-timeline-item]": items, "[data-timeline-group]": groups, "[data-timeline-filter]": buttons }[selector] || [];
    }
  };
  const context = { window: {}, document };
  vm.createContext(context);
  vm.runInContext(read("assets/site.js"), context);
  assert(!tools.hidden, "Timeline filters were not progressively enabled");
  buttons.slice(1).forEach((button) => {
    button.click();
    const key = button.getAttribute("data-timeline-filter");
    const expected = timeline.items.filter((item) => [item.category, ...(item.alsoCategories || [])].includes(key)).length;
    assert(items.filter((item) => !item.hidden).length === expected, `Wrong timeline filter result for ${key}`);
    assert(button.getAttribute("aria-pressed") === "true", `Timeline filter ${key} is not announced as active`);
    assert(buttons.filter((item) => item.getAttribute("aria-pressed") === "true").length === 1, "Only one category should be active");
    assert(results.textContent.startsWith(`Showing ${expected} `), "Timeline result announcement is incorrect");
    assert(select.value === key, "Timeline mobile and desktop filters must stay in sync");
    groups.forEach((group) => assert(group.hidden === group.querySelectorAll().every((item) => item.hidden), "Empty timeline years should be hidden"));
  });
  buttons[0].click();
  assert(items.every((item) => !item.hidden) && groups.every((group) => !group.hidden), "All activities must restore all entries and year groups");
  assert(results.textContent === `Showing all ${items.length} activities`, "Timeline reset count is incorrect");
  select.value = "event";
  select.dispatch("change");
  assert(buttons.find((button) => button.getAttribute("data-timeline-filter") === "event").getAttribute("aria-pressed") === "true", "Mobile category changes must update the desktop control");
  assert(items.filter((item) => !item.hidden).length === timeline.items.filter((item) => item.category === "event" || item.alsoCategories?.includes("event")).length, "Mobile conference filter returned the wrong count");
}

const timelineHtml = read("timeline/index.html");
const timelineCategories = new Set(timeline.categories.map((category) => category.key));
assert(new Set(timeline.items.map((item) => item.id)).size === timeline.items.length, "Timeline IDs must be unique");
timeline.items.forEach((item) => {
  assert(item.title && item.role && item.date, `Incomplete timeline entry ${item.id}`);
  assert(/^20\d{2}(?:-\d{2}(?:-\d{2})?)?$/.test(item.start) || (!item.start && item.status === "forthcoming" && item.date === "Dates to be confirmed"), `Invalid timeline date ${item.id}`);
  assert(!item.end || item.end >= item.start, `Timeline ends before it starts: ${item.id}`);
  assert([item.category, ...(item.alsoCategories || [])].every((key) => timelineCategories.has(key)), `Unknown timeline category ${item.id}`);
  if (item.status !== "forthcoming") {
    assert(item.start <= "2026-10-29", `Future activity must be explicitly forthcoming: ${item.id}`);
  }
  assert(timelineHtml.includes(`id="${item.id}"`), `Timeline entry is missing from static HTML: ${item.id}`);
});
assert(countMatches(timelineHtml, /data-timeline-item\s/g) === timeline.items.length, "Timeline must include all entries without JavaScript");
assert(/data-timeline-tools hidden/.test(timelineHtml), "Inert timeline filters must stay hidden without JavaScript");
assert(/<script[^>]+src="\/assets\/site\.js\?v=[0-9a-f]{12}"/.test(timelineHtml), "Timeline must load its versioned enhancement script");
assert(timelineHtml.includes('role="status" aria-live="polite"'), "Timeline filter changes need a live announcement");
assert(!/caltech|mathathon/i.test(timelineHtml), "Undecided participation must stay off the timeline");
const forthcoming = timeline.items.filter((item) => item.status === "forthcoming");
assert(forthcoming.length === 6, "Timeline must contain the confirmed programmes, events and invited talks");
assert(forthcoming.find((item) => item.id === "royal-society-ai")?.role === "Attendee", "Royal Society attendance must not be presented as a talk");
assert(forthcoming.find((item) => item.id === "saige-maths-workshop")?.role === "Workshop participant", "SAIGE participation must not be presented as a talk");
const iliad = forthcoming.find((item) => item.id === "iliad-fellowship");
assert(iliad?.start === "2026-11-02" && iliad.end === "2027-02-05" && !iliad.details, "Iliad must retain confirmed dates without invented duties");
const intensive = forthcoming.find((item) => item.id === "iliad-intensive");
assert(intensive?.start === "2026-11-02" && intensive.end === "2026-11-27" && intensive.role === "Participant", "Iliad Intensive must have its own dates and participant role");
["paris-2026"].forEach((id) => {
  const talk = forthcoming.find((item) => item.id === id);
  assert(talk?.category === "talk" && talk.role === "Invited speaker", `Missing forthcoming invited talk: ${id}`);
});
const texasTalk = timeline.items.find((item) => item.id === "tamu-2026");
assert(texasTalk?.status !== "forthcoming" && texasTalk?.role === "Invited speaker" && texasTalk?.links.some((link) => link.label === "Slides"), "The completed Texas talk must include its public slides");
const newcastle = timeline.items.find((item) => item.id === "yfaw-2024");
assert(newcastle?.role === "Attendee" && newcastle.category === "event" && !newcastle.presentation, "Newcastle attendance must not imply a presentation");
assert(timeline.items.find((item) => item.id === "waterloo-2024")?.date === "8–13 July 2024", "Waterloo timeline entry must use verified official event dates");
testTimelineFilters();

const talksHtml = read("talks/index.html");
assert(talks.categories.map((category) => category.key).join(",") === "invited,other", "Invited talks must be presented before conference and other talks");
assert(talks.items.every((talk) => talks.categories.some((category) => category.key === talk.category)), "Every talk must have an explicit category");
assert(countMatches(talksHtml, /<article class="talk">/g) === talks.items.length, "Static talk count does not match the data");
assert(countMatches(talksHtml, /<section class="talk-year"/g) === new Set(talks.items.map((talk) => `${talk.category}-${String(talk.date).match(/\b20\d{2}\b/)?.[0] || "Earlier"}`)).size, "Talk year groups do not match their categories");
assert(talksHtml.indexOf('id="talk-category-invited"') >= 0 && talksHtml.indexOf('id="talk-category-invited"') < talksHtml.indexOf('id="talk-category-other"'), "Invited talks must appear first in the generated page");
assert(talksHtml.includes('<h4 class="talk__title">'), "Talk titles must sit below their category and year headings");

const cvHtml = read("cv/index.html");
assert(cvHtml.includes("Research interests:"), "Research interests must appear near the top of the web CV");
assert(cvHtml.includes(`Last updated: ${cv.profile.lastUpdated}.`), "Web CV update date must match its data");
assert(cvHtml.includes("Earlier awards and scholarships"), "Older web-CV awards must remain available in a compact section");
assert(cvHtml.includes('<h4 class="entry__title">FUSRP:'), "Grouped CV entries must use a heading below their h3 subsection");

const css = read("assets/site.css");
assert(/\[hidden\]\s*\{\s*display:\s*none\s*!important;/.test(css), "CSS must enforce native hidden semantics");
assert(css.includes(".skip-link"), "CSS is missing skip-link styling");
assert(css.includes(":focus-visible"), "CSS is missing keyboard focus styling");
assert(css.includes(':root[data-theme="dark"]'), "CSS is missing its dark palette");

const themeScript = read("assets/theme.js");
canonicalPages.forEach((relativePath) => {
  const html = read(relativePath);
  const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert(html.includes('<html lang="en" data-theme="light">'), `${relativePath} must default to light without JavaScript`);
  [
    { stored: "", expected: "light" },
    { stored: "invalid", expected: "light" },
    { stored: "dark", expected: "dark" },
    { stored: "light", expected: "light" },
    { stored: "", expected: "light", blocked: true }
  ].forEach((scenario) => {
    let stored = scenario.stored;
    const root = new FakeElement({ "data-theme": "light" });
    const button = new FakeElement();
    const context = {
      document: { documentElement: root, querySelector: () => button },
      window: {
        // A dark device preference must not override the site's day default.
        matchMedia: () => ({ matches: true }),
        localStorage: {
          getItem() { if (scenario.blocked) throw new Error("Storage unavailable"); return stored; },
          setItem(key, value) { if (scenario.blocked) throw new Error("Storage unavailable"); stored = value; }
        }
      }
    };
    vm.createContext(context);
    vm.runInContext(bootstrap, context);
    vm.runInContext(themeScript, context);
    assert(root.getAttribute("data-theme") === scenario.expected, `${relativePath} initial theme is incorrect`);
    const next = scenario.expected === "dark" ? "light" : "dark";
    assert(button.getAttribute("aria-label") === `Switch to ${next} theme`, `${relativePath} theme toggle label is incorrect`);
    button.click();
    assert(root.getAttribute("data-theme") === next, `${relativePath} theme toggle does not work`);
    vm.runInContext(bootstrap, context);
    assert(root.getAttribute("data-theme") === (scenario.blocked ? "light" : next), `${relativePath} must remember a manual theme choice when storage is available`);
  });
});
assert(read("assets/favicon.svg").includes("AA monogram"), "The AA monogram favicon must be preserved");

const sitemap = read("sitemap.xml");
["/", "/cv/", "/research/", "/talks/", "/timeline/"].forEach((route) => {
  assert(sitemap.includes(`https://ahacua.github.io${route}`), `Sitemap is missing ${route}`);
});

process.stdout.write(`Validated ${canonicalPages.length} pages, ${publications.length} publications, ${talks.items.length} talks, and ${timeline.items.length} timeline activities.\n`);
