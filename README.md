# Antonio Acuaviva

Personal academic webpage for Antonio Acuaviva.

Page content is stored in `data/*.js` and is also prerendered into each HTML file so
search engines and browsers without JavaScript receive the complete page. After
editing page data, the renderer, styles, or downloadable assets, run:

```sh
npm run build
```

The build prerenders each page, adds content-hash cache versions to local assets,
and validates the generated site. Commit the refreshed HTML with the source changes.
GitHub Actions repeats the build and fails if the generated pages are stale.

Pages open in light mode by default, including on devices set to dark mode.
The theme toggle remembers a visitor's explicit choice when browser storage is available.

The Timeline at `/timeline/` selects education, research, talks and conferences
from the existing page data. Its selection and additional confirmed activities
live in `data/timeline.js`; the prerenderer supplies the CV, Talks and Publications
data at build time. Conference entries with a presentation appear in both the
Events & workshops and Talks filters. Attendance-only entries do not appear in
the Talks filter or change the Talks page. Forthcoming invited talks are taken
from the Talks section of the October 2026 CV.

Forthcoming status is editorial: review it after participation is confirmed,
rather than treating a passing date as proof of attendance. Keep dates only as
precise as the source supports. The Iliad entry follows the October 2026 CV's
“Iliad Fellowship (forthcoming)” wording, without adding research duties. The
Intensive is a separate activity with separately confirmed participation and dates.
