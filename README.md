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
