(function () {
  // Historical wording comes from the existing CV, Talks and Publications data.
  // Sources are supplied at build time; this file is never loaded by visitors.
  var sources = window.siteTimelineSources;
  var education = sources.cv.sections.find(function (section) { return section.title === "Education"; }).entries;
  var research = sources.cv.sections.find(function (section) { return section.title === "Experience"; }).groups[0].entries;
  var fieldsResearch = research.find(function (entry) { return entry.title.indexOf("FUSRP:") === 0; });
  var icmatResearch = research.find(function (entry) { return entry.organization === "Institute of Mathematical Sciences (ICMAT)"; });
  var papers = sources.research.categories.reduce(function (items, category) { return items.concat(category.items); }, []);

  function educationEntry(index, id, start, end, role, details) {
    var entry = education[index];
    return {
      id: id, category: "education", start: start, end: end,
      date: entry.dates, title: entry.title, organization: entry.organization,
      location: entry.location, role: role, details: details,
      status: index === 0 ? "ongoing" : "",
      links: [{ label: "CV", url: "/cv/" }]
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

  function researchPaper(title, id, start, date, role, details) {
    var paper = papers.find(function (item) { return item.title === title; });
    return {
      id: id, category: "research", start: start, date: date,
      title: paper.title, organization: "Preprint · arXiv", role: role,
      details: details, links: paper.links
    };
  }

  window.sitePageData = {
    intro: "Research, talks and academic milestones in mathematics, with a growing interest in AI.",
    categories: [
      { key: "talk", label: "Talks" },
      { key: "event", label: "Events & workshops" },
      { key: "fellowship", label: "Fellowships" },
      { key: "education", label: "Education" },
      { key: "research", label: "Research" },
      { key: "milestone", label: "Awards & milestones" }
    ],
    items: [
      // Invited talks from the Talks section of the October 2026 CV.
      // The completed Texas talk and its public slides are recorded on Talks.
      Object.assign(selectedTalk("Banach and Metric Space Geometry Seminar", "tamu-2026", "2026-10-28"), { role: "Invited speaker" }),
      // Confirmed by Antonio on 27 October 2026. Participation remains forthcoming
      // until reviewed after the event; a passing date is not proof of attendance.
      {
        id: "royal-society-ai", category: "event", status: "forthcoming",
        start: "2026-10-29", date: "29 October 2026",
        title: "Mathematics in the age of AI", organization: "The Royal Society",
        location: "London, UK", role: "Attendee",
        links: [{ label: "Official event", url: "https://portal.royalsociety.org/events/details/?id=baa5caea-28ff-491f-b747-7b9fea66d759" }]
      },
      {
        id: "saige-maths-workshop", category: "event", status: "forthcoming",
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
      researchPaper(
        "A negative solution to the complemented subspace problem for Banach spaces with unconditional bases",
        "complemented-subspace-preprint", "2026-09-08", "8 September 2026", "Author",
        "Banach space theory: complemented subspaces and unconditional bases."
      ),
      selectedTalk("Brazilian Workshop on Banach Spaces (BWB 2026)", "bwb-2026", "2026-08-26", "", true),
      researchPaper(
        "Mathematical Discovery in the Wild: AI-Guided Proofs in Banach Space Theory",
        "ai-guided-proofs", "2026-07-19", "19 July 2026", "Co-author",
        "Joint work with Pablo Acuaviva on AI-guided mathematical research in Banach space theory."
      ),
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
      educationEntry(0, "lancaster-phd", "2023-10", "", "Doctoral researcher",
        "Supervised by Professor Niels J. Laustsen. Supported by an EPSRC Doctoral Training Partnership Studentship. Research in Banach space theory and operator theory."),
      {
        id: "cambridge-distinction", category: "milestone", start: "2023-06", date: "June 2023",
        title: "Part III completed with Distinction", organization: "University of Cambridge",
        location: "Cambridge, UK", role: "Graduate",
        details: "Received the 1912 Senior Scholarship and Fitzwilliam College Prize for academic performance.",
        links: [{ label: "CV", url: "/cv/" }]
      },
      educationEntry(1, "cambridge-part-iii", "2022-10", "2023-06", "MASt student", "Supported by the la Caixa Foundation Postgraduate Fellowship Abroad."),
      {
        id: "ucm-graduation", category: "milestone", start: "2022-06", date: "June 2022",
        title: "Graduated first in Mathematics and Physics", organization: "Universidad Complutense de Madrid",
        location: "Madrid, Spain", role: "Graduate",
        details: "Ranked 1st of 171 graduates in Mathematics and 1st of 247 in Physics. Recipient of the Bachelor's Degree Extraordinary Award in both subjects.",
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
      },
      educationEntry(3, "berkeley-exchange", "2019-08", "2020-06", "Exchange student", "Supported by the UCM–University of California Scholarship."),
      educationEntry(2, "ucm-degrees", "2017-09", "2022-06", "Undergraduate student", "Degrees in Mathematics and Physics. Physics thesis: Resilient Source Seeking with Robot Swarms.")
    ]
  };
})();
