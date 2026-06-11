# srishabh.com

Personal site of Rishabh Saxena — engineering leadership portfolio.
Dark cinematic redesign: three.js particle hero + GSAP scroll choreography,
built as a plain Jekyll site (GitHub Pages compatible, no gulp/npm build needed).

## Structure

- `index.html` — composes the page from `_includes/` (nav, hero, statement, metrics, principles, journey, multiplier, contact)
- `_data/experience.yml` — career timeline (edit this to update the Journey section)
- `css/main.css` — all styles (the old `_scss` pipeline is no longer used)
- `js/main.js` — particle field + animations; libraries vendored in `js/vendor/`
- `preview.html` — local preview artifact, excluded from the build (safe to delete)

Legacy includes from the old design (`intro.html`, `background.html`, `switch.html`,
`education.html`, `experience.html`, etc.) are unused and can be deleted.

## ⚠️ Numbers to verify before publishing

The copy includes placeholder leadership metrics — adjust to reality:

- "15+ engineers hired, coached & promoted" (`_includes/metrics.html`)
- "3 teams built or scaled from the ground up" (`_includes/metrics.html`)
- "100M+ daily requests" (`_includes/metrics.html`)
- "8 years from first commit to org-level scope" (`_includes/metrics.html`)
- EM start year "2023" and role scope lines (`_data/experience.yml`)
- "Hundreds of interviews" (`_includes/multiplier.html`)

## Develop locally

```sh
gem install jekyll
jekyll serve
```

## Deploy

Push to `master` — GitHub Pages builds it automatically. `CNAME` is preserved.
