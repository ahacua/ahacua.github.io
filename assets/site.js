(function () {
  var app = document.getElementById("app");
  var page = document.body ? document.body.dataset.page : "";
  var data = window.sitePageData;

  if (!app || !data) {
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getLinkIcon(label) {
    var normalized = String(label || "").toLowerCase();

    if (normalized.indexOf("project") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.9 9h-3.02a15.6 15.6 0 0 0-1.55-5.02A8.03 8.03 0 0 1 18.9 11ZM12 4.04c1.17 1.5 2.08 3.93 2.38 6.96H9.62C9.92 7.97 10.83 5.54 12 4.04ZM4 12c0-.34.02-.67.06-1h3.06c-.07.64-.12 1.31-.12 2s.05 1.36.12 2H4.06A8.2 8.2 0 0 1 4 12Zm1.1 5h3.02c.32 1.87.89 3.62 1.65 5.02A8.03 8.03 0 0 1 5.1 17ZM8.12 11h7.76c.08.64.12 1.31.12 2s-.04 1.36-.12 2H8.12A16.9 16.9 0 0 1 8 13c0-.69.04-1.36.12-2ZM12 19.96c-1.17-1.5-2.08-3.93-2.38-6.96h4.76c-.3 3.03-1.21 5.46-2.38 6.96ZM14.23 22.02c.76-1.4 1.33-3.15 1.65-5.02h3.02a8.03 8.03 0 0 1-4.67 5.02ZM16.88 9H15.1c-.32-1.87-.89-3.62-1.65-5.02A8.03 8.03 0 0 1 18.9 9ZM10.55 3.98C9.79 5.38 9.22 7.13 8.9 9H7.12a8.03 8.03 0 0 1 3.43-5.02Z"/></svg>';
    }

    if (normalized.indexOf("proceedings") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a2.25 2.25 0 1 1 0 4.5A2.25 2.25 0 0 1 12 3Zm-4 6.5h8A2.5 2.5 0 0 1 18.5 12v1h-3.75v7h-1.5v-4h-2.5v4h-1.5v-7H5.5v-1A2.5 2.5 0 0 1 8 9.5Zm-2.5 5h13v1.5h-13Z"/></svg>';
    }

    if (normalized.indexOf("slides") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-6.2l1.9 2H18v1.5H6V19h2.3l1.9-2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm.5 1.5v9h15v-9Z"/></svg>';
    }

    if (normalized.indexOf("pdf") !== -1 || normalized.indexOf("journal") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm6 1.5V9h4.5M9 13h1.4a2.1 2.1 0 1 1 0 4.2H9Zm1.2 1v2.2h.2a1.1 1.1 0 1 0 0-2.2Zm3.3-1h2.9v1h-1.7v.7h1.5v1h-1.5v1.5h-1.2Zm-1.2 0v4.2h-1.2V13Z"/></svg>';
    }

    if (normalized.indexOf("code") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.7 16.6-4.6-4.6 4.6-4.6 1.4 1.4L6.9 12l3.2 3.2Zm6.6 0-1.4-1.4 3.2-3.2-3.2-3.2 1.4-1.4 4.6 4.6Zm-5.6 2.1 2.6-13 1.2.2-2.6 13Z"/></svg>';
    }

    if (normalized.indexOf("arxiv") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H14ZM5 5h6v2H7v10h10v-4h2v6H5Z"/></svg>';
    }

    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14ZM19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5v2H5v12h12v-5Z"/></svg>';
  }

  function getProfileLinkIcon(label) {
    var normalized = String(label || "").toLowerCase();

    if (normalized.indexOf("scholar") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3.5 7.5 12 12l6.97-3.69V14H21V7.5ZM6.5 12.5V16c0 1.66 2.46 3 5.5 3s5.5-1.34 5.5-3v-3.5L12 15.5Z"/></svg>';
    }

    if (normalized.indexOf("linkedin") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 8.7A1.35 1.35 0 1 1 6.6 6a1.35 1.35 0 0 1 0 2.7ZM5.5 10h2.2v8H5.5Zm4 0h2.1v1.1h.03c.29-.56 1.01-1.35 2.39-1.35 2.56 0 3.02 1.69 3.02 3.89V18h-2.2v-3.83c0-.91-.02-2.09-1.27-2.09-1.28 0-1.48 1-1.48 2.03V18H9.5Z"/></svg>';
    }

    if (normalized.indexOf("orcid") !== -1) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-3.1 4.8a1 1 0 1 1-1 1 1 1 0 0 1 1-1Zm-1 2.7h2v7.1h-2Zm3.4 0h2.9a3 3 0 1 1 0 6h-.9v1.1h-2Zm2 1.8v2.5h.76a1.25 1.25 0 0 0 0-2.5Z"/></svg>';
    }

    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 14.93V17a1 1 0 1 1-2 0v-.07A8 8 0 0 1 4.07 13H4a1 1 0 0 1 0-2h.07A8 8 0 0 1 11 4.07V4a1 1 0 1 1 2 0v.07A8 8 0 0 1 19.93 11H20a1 1 0 0 1 0 2h-.07A8 8 0 0 1 13 16.93ZM6.1 11H8.2a12.7 12.7 0 0 1 1.02-4.01A6.02 6.02 0 0 0 6.1 11Zm3.13 0h5.54A10.98 10.98 0 0 0 12 6.03 10.98 10.98 0 0 0 9.23 11Zm0 2A10.98 10.98 0 0 0 12 17.97 10.98 10.98 0 0 0 14.77 13Zm5.55-2h2.12a6.02 6.02 0 0 0-3.12-4.01A12.7 12.7 0 0 1 14.78 11Zm2.12 2h-2.12a12.7 12.7 0 0 1-1.02 4.01A6.02 6.02 0 0 0 16.9 13Zm-7.68 4.01A12.7 12.7 0 0 1 8.2 13H6.1a6.02 6.02 0 0 0 3.12 4.01Z"/></svg>';
  }

  function renderBullets(items) {
    if (!items || !items.length) {
      return "";
    }

    return (
      '<ul class="entry__bullets">' +
      items.map(function (item) {
        if (item && typeof item === "object" && item.html) {
          return "<li>" + item.html + "</li>";
        }

        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") +
      "</ul>"
    );
  }

  function renderEntry(entry) {
    var meta = [];

    if (entry.location) {
      meta.push("<p>" + escapeHtml(entry.location) + "</p>");
    }

    if (entry.dates) {
      meta.push("<p>" + escapeHtml(entry.dates) + "</p>");
    }

    return (
      '<article class="entry">' +
        '<header class="entry__header">' +
          '<div class="entry__main">' +
            '<h3 class="entry__title">' + escapeHtml(entry.title) + "</h3>" +
            (entry.organization ? '<p class="entry__org">' + escapeHtml(entry.organization) + "</p>" : "") +
          "</div>" +
          '<div class="entry__meta">' + meta.join("") + "</div>" +
        "</header>" +
        renderBullets(entry.bullets) +
      "</article>"
    );
  }

  function renderHome() {
    app.innerHTML =
      '<section class="hero hero--home">' +
        '<div class="hero__content">' +
          '<p class="hero__eyebrow">' + escapeHtml(data.hero.eyebrow) + "</p>" +
          '<h1 class="hero__title">' + escapeHtml(data.hero.title) + "</h1>" +
          '<p class="hero__meta">' + escapeHtml(data.hero.meta) + "</p>" +
          (data.links && data.links.length ? (
            '<div class="profile-links" aria-label="Professional links">' +
              data.links.map(function (link) {
                return '<a class="profile-link" href="' + escapeHtml(link.href) + '" target="_blank" rel="noreferrer noopener">' + getProfileLinkIcon(link.label) + '<span>' + escapeHtml(link.label) + "</span></a>";
              }).join("") +
            "</div>"
          ) : "") +
          '<p class="hero__summary">' + escapeHtml(data.hero.summary) + "</p>" +
        "</div>" +
      "</section>" +
      '<section class="page-section">' +
        '<h2 class="section-title">About</h2>' +
        '<div class="about-copy">' +
          data.about.map(function (paragraph) {
            return '<p>' + escapeHtml(paragraph) + "</p>";
          }).join("") +
        "</div>" +
      "</section>" +
      '<section class="page-section page-section--image">' +
        '<div class="hero__media hero__media--closing">' +
          '<img class="hero__image" src="' + escapeHtml(data.hero.image) + '" alt="' + escapeHtml(data.hero.imageAlt || "") + '">' +
        "</div>" +
      "</section>";
  }

  function renderCV() {
    var profile = data.profile;
    var downloadLink = "";

    if (profile.downloadHref) {
      downloadLink =
        '<p class="hero__actions">' +
          '<a class="hero__button" href="' + escapeHtml(profile.downloadHref) + '" download="' + escapeHtml(profile.downloadFilename || "") + '">' +
            escapeHtml(profile.downloadLabel || "Download CV") +
          "</a>" +
        "</p>";
    }

    var sections = data.sections.map(function (section) {
      if (section.kind === "timeline") {
        return (
          '<section class="page-section">' +
            '<h2 class="section-title">' + escapeHtml(section.title) + "</h2>" +
            section.entries.map(renderEntry).join("") +
          "</section>"
        );
      }

      if (section.kind === "grouped-timeline") {
        return (
          '<section class="page-section">' +
            '<h2 class="section-title">' + escapeHtml(section.title) + "</h2>" +
            section.groups.map(function (group) {
              return (
                '<div class="subsection">' +
                  '<h3 class="subsection-title">' + escapeHtml(group.title) + "</h3>" +
                  group.entries.map(renderEntry).join("") +
                "</div>"
              );
            }).join("") +
          "</section>"
        );
      }

      if (section.kind === "awards") {
        return (
          '<section class="page-section">' +
            '<h2 class="section-title">' + escapeHtml(section.title) + "</h2>" +
            '<div class="awards">' +
              section.entries.map(function (award) {
                return (
                  '<article class="award">' +
                    '<p class="award__year">' + escapeHtml(award.year) + "</p>" +
                    "<div>" +
                      '<h3 class="award__title">' + escapeHtml(award.title) + "</h3>" +
                      '<p class="award__detail">' + escapeHtml(award.organization) + "</p>" +
                      (award.note ? '<p class="award__detail">' + escapeHtml(award.note) + "</p>" : "") +
                    "</div>" +
                  "</article>"
                );
              }).join("") +
            "</div>" +
          "</section>"
        );
      }

      if (section.kind === "skills") {
        return (
          '<section class="page-section">' +
            '<h2 class="section-title">' + escapeHtml(section.title) + "</h2>" +
            '<div class="skills">' +
              section.entries.map(function (item) {
                return (
                  '<article class="skill">' +
                    '<h3 class="skill__title">' + escapeHtml(item.title) + "</h3>" +
                    '<p class="skill__detail">' + escapeHtml(item.detail) + "</p>" +
                  "</article>"
                );
              }).join("") +
            "</div>" +
          "</section>"
        );
      }

      return "";
    }).join("");

    app.innerHTML =
      '<section class="hero">' +
        '<div class="hero__header">' +
          '<div class="hero__intro">' +
            '<p class="hero__eyebrow">' + escapeHtml(profile.role) + "</p>" +
            '<h1 class="hero__title">' + escapeHtml(profile.name) + "</h1>" +
            ((profile.institution || profile.location) ? '<p class="hero__meta">' + escapeHtml((profile.institution || "") + ((profile.institution && profile.location) ? " | " : "") + (profile.location || "")) + "</p>" : "") +
            (profile.summary ? '<p class="hero__summary">' + escapeHtml(profile.summary) + "</p>" : "") +
          "</div>" +
          downloadLink +
        "</div>" +
      "</section>" +
      sections;
  }

  function renderResearch() {
    app.innerHTML =
      '<section class="hero">' +
        '<p class="hero__eyebrow">Research</p>' +
        '<h1 class="hero__title">Publications</h1>' +
        (data.intro ? '<p class="page-intro">' + escapeHtml(data.intro) + "</p>" : "") +
      "</section>" +
      data.categories.map(function (category) {
        return (
          '<section class="page-section">' +
            '<h2 class="section-title">' + escapeHtml(category.title) + "</h2>" +
            '<ol class="publications">' +
              category.items.map(function (item) {
                var links = "";

                if (item.links && item.links.length) {
                  links =
                    '<div class="publication__links" aria-label="Publication links">' +
                    item.links.map(function (link) {
                      return (
                        '<a class="publication__link" href="' + escapeHtml(link.url) + '" target="_blank" rel="noreferrer noopener">' +
                          '<span class="publication__link-icon">' + getLinkIcon(link.label) + "</span>" +
                          '<span class="publication__link-label">' + escapeHtml(link.label) + "</span>" +
                        "</a>"
                      );
                    }).join("") +
                    "</div>";
                }

                return (
                  '<li class="publication">' +
                    '<div class="publication__year">' + escapeHtml(item.year) + "</div>" +
                    '<div class="publication__body">' +
                      '<h3 class="publication__title">' + escapeHtml(item.title) + "</h3>" +
                      '<p class="publication__authors">' + escapeHtml(item.authors) + "</p>" +
                      '<p class="publication__citation">' +
                        '<span class="publication__venue">' + escapeHtml(item.venue) + "</span>" +
                        (item.details ? ", " + escapeHtml(item.details) : "") +
                        (item.status ? ' <span class="publication__status">' + escapeHtml(item.status) + "</span>" : "") +
                      "</p>" +
                      links +
                    "</div>" +
                  "</li>"
                );
              }).join("") +
            "</ol>" +
          "</section>"
        );
      }).join("");
  }

  function renderTalks() {
    var body = "";

    if (data.items && data.items.length) {
      body = '<div class="talks">' +
        data.items.map(function (talk) {
          var event = escapeHtml(talk.event);
          var links = "";

          if (talk.eventUrl) {
            event = '<a href="' + escapeHtml(talk.eventUrl) + '" target="_blank" rel="noreferrer noopener">' + event + "</a>";
          }

          if (talk.links && talk.links.length) {
            links =
              '<div class="publication__links" aria-label="Talk links">' +
              talk.links.map(function (link) {
                var extraAttrs = ' target="_blank" rel="noreferrer noopener"';

                if (link.download) {
                  extraAttrs = ' download="' + escapeHtml(link.downloadFilename || "") + '"';
                }

                return (
                  '<a class="publication__link" href="' + escapeHtml(link.url) + '"' + extraAttrs + ">" +
                    '<span class="publication__link-icon">' + getLinkIcon(link.label) + "</span>" +
                    '<span class="publication__link-label">' + escapeHtml(link.label) + "</span>" +
                  "</a>"
                );
              }).join("") +
              "</div>";
          }

          return (
            '<article class="talk">' +
              '<h3 class="talk__title">' + escapeHtml(talk.title) + "</h3>" +
              '<p class="talk__detail">' + event + "</p>" +
              (talk.location ? '<p class="talk__detail">' + escapeHtml(talk.location) + "</p>" : "") +
              (talk.date ? '<p class="talk__detail">' + escapeHtml(talk.date) + "</p>" : "") +
              (talk.note ? '<p class="talk__detail">' + escapeHtml(talk.note) + "</p>" : "") +
              links +
            "</article>"
          );
        }).join("") +
      "</div>";
    } else {
      body = '<p class="talks-empty">' + escapeHtml(data.empty_message || "No talks have been added yet.") + "</p>";
    }

    app.innerHTML =
      '<section class="hero">' +
        '<p class="hero__eyebrow">Speaking</p>' +
        '<h1 class="hero__title">Talks</h1>' +
        (data.intro ? '<p class="page-intro">' + escapeHtml(data.intro) + "</p>" : "") +
      "</section>" +
      '<section class="page-section page-section--talks">' +
        body +
      "</section>";
  }

  if (page === "home") {
    renderHome();
  } else if (page === "cv") {
    renderCV();
  } else if (page === "research") {
    renderResearch();
  } else if (page === "talks") {
    renderTalks();
  }
})();
