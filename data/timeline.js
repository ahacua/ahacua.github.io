(function () {
  // Historical wording comes from the existing CV, Talks and Publications data.
  // Sources are supplied at build time; this file is never loaded by visitors.
  var sources = window.siteTimelineSources;
  var education = sources.cv.sections.find(function (section) { return section.title === "Education"; }).entries;
  var research = sources.cv.sections.find(function (section) { return section.title === "Experience"; }).groups[0].entries;
  var fieldsResearch = research.find(function (entry) { return entry.title.indexOf("FUSRP:") === 0; });
  var icmatResearch = research.find(function (entry) { return entry.organization === "Institute of Mathematical Sciences (ICMAT)"; });
  var honours = sources.cv.sections.find(function (section) { return section.title === "Honours and Awards"; });

  function academicPeriod(index, id, start, end, dates, summary, notes) {
    var entry = education[index];
    return {
      id: id, start: start, end: end, dates: dates,
      title: entry.title, organization: entry.organization,
      location: entry.location, summary: summary, notes: notes || ""
    };
  }

  function selectedTalk(event, id, start, end, conference) {
    var talk = sources.talks.items.find(function (item) { return item.event === event; });
    return {
      id: id, category: conference ? "event" : "talk", alsoCategories: conference ? ["talk"] : [], start: start, end: end,
      date: talk.date, title: conference ? talk.event : talk.title, organization: conference ? "" : talk.event,
      presentation: conference ? talk.title : "",
      location: talk.location, role: conference ? "Speaker & attendee" : "Speaker",
      // Preserve event date ranges without implying an exact presentation day.
      details: end ? "Dates shown are the event dates." : "",
      links: (talk.eventUrl ? [{ label: "Event", url: talk.eventUrl }] : []).concat(talk.links || [])
    };
  }

  // First-submission dates verified against the linked arXiv records.
  var paperDates = {
    "2609.28584": "2026-09-23", "2609.17283": "2026-09-15",
    "2609.08921": "2026-09-08", "2608.18257": "2026-08-18",
    "2609.18993": "2026-07-17", "2608.03825": "2026-08-04",
    "2607.17388": "2026-07-19", "2607.15075": "2026-07-16",
    "2607.12935": "2026-07-14", "2607.01467": "2026-07-01",
    "2606.26417": "2026-06-24", "2605.29854": "2026-05-28",
    "2605.21711": "2026-05-20",
    "https://doi.org/10.1016/j.topol.2026.109987": "2026-10-02"
  };

  function publication(paper, category) {
    var url = paper.links[0].url;
    var arxiv = url.match(/arxiv\.org\/abs\/([^/?#]+)/);
    var key = arxiv ? arxiv[1] : url;
    var start = paperDates[key] || paper.year;
    var date = start.length === 10 ? new Date(start + "T12:00:00Z").toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
    }) : paper.year;
    return {
      id: "paper-" + key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
      category: "publication", start: start, date: date, title: paper.title,
      organization: paper.venue, role: category.key === "preprints" ? "Preprint" : "Published",
      details: paper.authors + ". " + paper.details +
        (arxiv ? ". Date shown is the first arXiv submission." : start.length === 4 ? ". Year shown is the publication year." : ". Date shown is the online publication date."),
      links: paper.links
    };
  }

  function awardEntry(award) {
    var years = award.year.match(/\b\d{4}\b/g);
    var programme = /Programme/.test(award.title);
    var fellowship = /Fellowship|Studentship/.test(award.title);
    // Associate year-only funding awards with the studies they supported.
    var period = /EPSRC/.test(award.title) || Number(years[0]) >= 2024 ? "lancaster-phd" :
      /1912 Senior|Fitzwilliam College|Postgraduate Fellowship Abroad/.test(award.title) ? "cambridge-part-iii" :
      Number(years[0]) < 2017 ? "before-university" : "ucm-degrees";
    return {
      id: "award-" + award.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""),
      category: programme ? "event" : fellowship ? "fellowship" : "milestone",
      alsoCategories: programme || fellowship ? ["milestone"] : [],
      start: years[0], end: years.length > 1 ? years[years.length - 1] : "",
      date: award.year, period: period, title: award.title,
      organization: award.title === "Goñi and Rey Foundation Fellowship" ? "Goñi and Rey Foundation" : award.organization,
      role: programme ? "Programme participant" : /Studentship/.test(award.title) ? "Studentship recipient" : fellowship ? "Fellowship recipient" :
        /Scholarship|Becas/.test(award.title) ? "Scholarship recipient" :
        /Grant/.test(award.title) ? "Grant recipient" : /Prize/.test(award.title) ? "Prize recipient" : "Award recipient",
      details: award.title === "Goñi and Rey Foundation Fellowship" ? award.organization + "." : award.note || "",
      links: [{ label: "CV", url: "/cv/" }]
    };
  }

  window.sitePageData = {
    intro: "Talks, research and other activities through the chapters of my academic life.",
    periods: [
      academicPeriod(0, "lancaster-phd", "2023-10", "", "2023–present",
        "Banach space theory and operator theory, supervised by Professor Niels J. Laustsen. Supported by an EPSRC Doctoral Training Partnership Studentship."),
      academicPeriod(1, "cambridge-part-iii", "2022-10", "2023-06", "2022–2023",
        "Completed with Distinction. Supported by the la Caixa Foundation Postgraduate Fellowship Abroad."),
      academicPeriod(2, "ucm-degrees", "2017-09", "2022-06", "2017–2022",
        "Degrees in Mathematics and Physics.",
        "2019–2020 · Exchange year at the University of California, Berkeley, supported by the UCM–University of California Scholarship."),
      {
        id: "before-university", start: "2015", end: "2017", dates: "2015–2017",
        title: "Before university", organization: "", location: "",
        summary: "Early awards and scholarships."
      }
    ],
    categories: [
      { key: "publication", label: "Publications" },
      { key: "talk", label: "Talks" },
      { key: "event", label: "Events & workshops" },
      { key: "fellowship", label: "Fellowships" },
      { key: "research", label: "Research experience" },
      { key: "milestone", label: "Awards & milestones" }
    ],
    items: [
      // Invited talks from the Talks section of the October 2026 CV.
      // The completed Texas talk and its public slides are recorded on Talks.
      Object.assign(selectedTalk("Banach and Metric Space Geometry Seminar", "tamu-2026", "2026-10-28"), { role: "Invited speaker" }),
      // Completed participation confirmed by Antonio on 31 October 2026.
      {
        id: "royal-society-ai", category: "event",
        start: "2026-10-29", date: "29 October 2026",
        title: "Mathematics in the age of AI", organization: "The Royal Society",
        location: "London, UK", role: "Attendee",
        links: [{ label: "Official event", url: "https://portal.royalsociety.org/events/details/?id=baa5caea-28ff-491f-b747-7b9fea66d759" }]
      },
      {
        // Participation reconfirmed on 31 October, during the workshop.
        id: "saige-maths-workshop", category: "event", status: "ongoing",
        start: "2026-10-30", end: "2026-11-01", date: "30 October–1 November 2026",
        title: "Maths for AI Safety Workshop", organization: "Safe AI Germany (SAIGE)",
        location: "Bonn, Germany", role: "Workshop participant",
        links: [{ label: "Official event", url: "https://safeaigermany.org/programmes/maths-workshop/" }]
      },
      {
        id: "iliad-fellowship", category: "fellowship", status: "forthcoming",
        start: "2026-11-02", end: "2027-02-05", date: "2 November 2026–5 February 2027",
        // October 2026 CV, Selected Research Experience:
        // "Iliad Fellowship (forthcoming)". No research duties are stated.
        title: "Iliad Fellowship", role: "Fellow",
        links: [{ label: "Fellowship", url: "https://www.iliad.ac/fellowship" }]
      },
      {
        id: "iliad-intensive", category: "event", status: "forthcoming",
        start: "2026-11-02", end: "2026-11-27", date: "2–27 November 2026",
        // Participation confirmed separately by Antonio on 27 October 2026.
        title: "Iliad Intensive", location: "London, UK", role: "Participant",
        links: [{ label: "Intensive", url: "https://www.iliad.ac/intensive" }, { label: "Programme dates", url: "https://www.iliad.ac/calendar" }]
      },
      {
        // Participation confirmed by Antonio on 30 October 2026.
        id: "caltech-mathathon", category: "event", status: "forthcoming",
        start: "2026-11-13", end: "2026-11-15", date: "13–15 November 2026",
        title: "Mathathon: Old Problems, New Proofs", organization: "Caltech",
        location: "Pasadena, California, USA", role: "Participant",
        details: "On-site round.",
        links: [{ label: "Official event", url: "https://mathathonchallenge.com/" }]
      },
      {
        id: "paris-2026", category: "talk", status: "forthcoming",
        start: "2026-11-19", date: "19 November 2026",
        title: "Séminaire d’Analyse Fonctionnelle", location: "Paris, France",
        role: "Invited speaker", details: "Invited seminar talk. Title to be announced.", links: []
      },
      {
        id: "jsps-fellowship", category: "fellowship", status: "forthcoming",
        start: "", date: "Dates to be confirmed",
        title: "JSPS research fellowship", organization: "Tokyo University of Science",
        location: "Tokyo, Japan", role: "Fellow",
        details: "JSPS Short-Term Pre/Postdoctoral Fellowship for Research in Japan (forthcoming).",
        links: []
      },
      selectedTalk("Brazilian Workshop on Banach Spaces (BWB 2026)", "bwb-2026", "2026-08-26", "", true),
      selectedTalk("Seminar on Geometry of Banach Spaces", "krakow-2026", "2026-05-20"),
      selectedTalk("Young Functional Analysts' Workshop 2026", "yfaw-2026", "2026-03-23", "2026-03-25", true),
      {
        id: "pure-mathematics-prize-2026", category: "milestone", start: "2026", date: "2026",
        title: "Pure Mathematics Prize", organization: "Lancaster University",
        location: "Lancaster, UK", role: "Prize recipient",
        details: "Awarded for exceptional performance during the third year of the PhD programme.",
        links: [{ label: "CV", url: "/cv/" }]
      },
      selectedTalk("Young Functional Analysts' Workshop 2025", "yfaw-2025", "2025-04-02", "2025-04-04", true),
      // Official conference dates are 8–13 July, unlike the legacy Talks entry.
      // Keep that existing page unchanged, and use the event dates here.
      Object.assign(selectedTalk("Banach Algebras and Operator Algebras", "waterloo-2024", "2024-07-08", "2024-07-13", true), { date: "8–13 July 2024" }),
      selectedTalk("BAFALASA", "bafalasa-2024", "2024-07-03", "2024-07-06", true),
      {
        id: "yfaw-2024", category: "event", start: "2024-04", date: "April 2024",
        title: "Young Functional Analysts' Workshop 2024", organization: "Newcastle University",
        location: "Newcastle upon Tyne, UK", role: "Attendee",
        // Attendance confirmed by Antonio and the official participant list.
        // Month verified against organiser Joseph Dessi's academic website.
        links: [
          { label: "Official event", url: "https://sites.google.com/site/yfawuk/previous-meetings/yfaw-2024-in-newcastle" },
          { label: "Participants", url: "https://sites.google.com/site/yfawuk/previous-meetings/yfaw-2024-in-newcastle/participants" }
        ]
      },
      {
        id: "pure-mathematics-prize-2024", category: "milestone", start: "2024", date: "2024",
        title: "Pure Mathematics Prize", organization: "Lancaster University",
        location: "Lancaster, UK", role: "Prize recipient",
        details: "Awarded for exceptional performance during the first year of the PhD programme.",
        links: [{ label: "CV", url: "/cv/" }]
      },
      {
        id: "icmat-2021", category: "research", start: "2021-06", end: "2021-09", date: "June–September 2021",
        title: icmatResearch.title, organization: icmatResearch.organization,
        location: icmatResearch.location, role: "Research grant recipient",
        details: "Second consecutive Severo Ochoa Introduction to Research Grant; projects in mathematical analysis.",
        links: [{ label: "CV", url: "/cv/" }]
      },
      {
        id: "fields-summer-research", category: "research", start: "2021-06", end: "2021-08", date: fieldsResearch.dates,
        title: fieldsResearch.title, organization: fieldsResearch.organization,
        location: fieldsResearch.location, role: "Undergraduate researcher",
        details: "Investigated state transfer in quantum walks with Ada Chan, Christino Tamon and Xiaohong Zhang. Presented research at the Canadian Undergraduate Mathematics Conference (2021).",
        links: [{ label: "CV", url: "/cv/" }, { label: "Research poster", url: "https://www.fields.utoronto.ca/sites/default/files/uploads/1.jpg" }]
      },
      {
        id: "icmat-2020", category: "research", start: "2020-06", end: "2020-09", date: "June–September 2020",
        title: icmatResearch.title, organization: icmatResearch.organization,
        location: icmatResearch.location, role: "Research grant recipient",
        details: "Severo Ochoa Introduction to Research Grant; projects in mathematical analysis.",
        links: [{ label: "CV", url: "/cv/" }]
      },
      {
        id: "cumc-2021", category: "event", alsoCategories: ["talk"], start: "2021", date: "2021",
        title: "Canadian Undergraduate Mathematics Conference (CUMC)",
        location: "Online", role: "Speaker & attendee",
        presentation: "Quantum Walks on Graphs: Perfect State Transfer and Periodicity",
        links: [{ label: "Conference", url: "https://cumc.math.ca/2021/students" }]
      }
    ].concat(sources.research.categories.reduce(function (items, category) {
      return items.concat(category.items.map(function (paper) { return publication(paper, category); }));
    }, [])).concat(honours.entries.concat(honours.additionalEntries || []).filter(function (award) {
      // The two Lancaster prizes above retain their separately confirmed years.
      return award.title !== "Pure Mathematics Prize";
    }).map(awardEntry)).map(function (item) {
      item.period = item.period || (!item.start || item.start >= "2023-10" ? "lancaster-phd" :
        item.start >= "2022-10" ? "cambridge-part-iii" : "ucm-degrees");
      return item;
    })
  };
})();
