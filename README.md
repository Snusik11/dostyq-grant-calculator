<a href="https://snusik11.github.io/dostyq-grant-calculator/">
    <img src="assets/logo.webp" alt="Dostyq Online" title="Dostyq Online" align="right" height="60" />
</a>

# Grant Chance Calculator

[![Live demo](https://img.shields.io/badge/demo-online-c2308f)](https://snusik11.github.io/dostyq-grant-calculator/)
[![GitHub Pages](https://img.shields.io/badge/hosting-GitHub%20Pages-222)](https://snusik11.github.io/dostyq-grant-calculator/)
![Vanilla JS](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20JS-f7df1e)
![No build step](https://img.shields.io/badge/build-none-success)
![Languages](https://img.shields.io/badge/UI-RU%20%2F%20KK-blue)

:star: Star us on GitHub, it motivates us a lot!

The **Grant Chance Calculator** by [DOSTYQ ONLINE](https://snusik11.github.io/dostyq-grant-calculator/) shows Kazakhstan university applicants how likely they are to win a state educational grant for the 2026–2027 academic year. Pick your profile subject pair, enter your total UNT (ЕНТ) score, tick the quotas you qualify for, and get a chance in percent for every specialty and every university.

It is a static site: no server, no database, no build step. All data ships next to the page as JSON, so it runs on plain GitHub Pages.

> The estimate is a heuristic, not a guarantee of admission. Use it as a guide.

> The interface is in Russian and Kazakh (switchable in the header), so the screenshots below show the Russian UI.

[![Grant Chance Calculator](docs/screenshots/02-results.png)](https://snusik11.github.io/dostyq-grant-calculator/)

## Table Of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [How the chance is calculated](#how-the-chance-is-calculated)
    - [Model limitations](#model-limitations)
- [Data sources](#data-sources)
- [Updating the data](#updating-the-data)
- [Deployment](#deployment)

## Features

| Section | Route | What it shows |
|---|---|---|
| Calculator | `#/` | Subject pair, UNT score and quotas → a list of specialties and universities with a chance in percent |
| Specialties | `#/specialties`, `#/specialties/{code}` | Catalog of specialties (GOP codes); a detail page with min/max scores by year, number of grants and universities |
| Universities | `#/universities`, `#/universities/{code}` | Catalog of universities (region, dormitory, military department); a detail page with all specialties and their passing scores |

What the calculator does:

- **Chance in percent** for every specialty × university pair, with a label: high (≥ 70%), medium (≥ 35%) or low.
- **Admission threshold filter.** A university is shown only if your score reaches its 2026 threshold for the competition.
- **Quotas:** general competition, rural quota, pedagogical quota, technical and agricultural state order, Western regions quota and the "Serpin" programme. Group quotas (orphans, large families, disability and others) are estimated for a whole group of specialties rather than a single university.
- **Competition panel.** How many test takers in your subject pair scored your score or higher, how that changed since 2025, and your percentile (National Testing Center data).
- **"My application".** A list of up to 4 priorities, like a real application. Stored in the browser.
- **Two languages:** Russian and Kazakh.
- **Light and dark themes** and a responsive layout down to 375 px.

## Screenshots

### Entering your data

[![Calculator form](docs/screenshots/01-calculator.png)](docs/screenshots/01-calculator.png)

Three steps: profile subjects, total UNT score, quotas.

### Results

[![Specialty cards with universities](docs/screenshots/03-specialty-cards.png)](docs/screenshots/03-specialty-cards.png)

Each specialty expands into a list of universities with the chance, the quota badge, and a "low data" badge when there were few winners last year.

### Specialty page and university page

| Specialty | University |
|---|---|
| [![Specialty page](docs/screenshots/04-specialty.png)](docs/screenshots/04-specialty.png) | [![University page](docs/screenshots/05-university.png)](docs/screenshots/05-university.png) |
| Min/max scores by year, number of grants, list of universities | Region, dormitory, military department, passing scores by specialty |

### Mobile and dark theme

<p align="center">
  <img src="docs/screenshots/06-mobile-dark.png" alt="Mobile layout in the dark theme" width="320" />
</p>

## Quick start

Any static file server will do. Opening `index.html` by double click will not work: the browser blocks loading `data/*.json` over `file://`.

```bash
git clone https://github.com/Snusik11/dostyq-grant-calculator.git
cd dostyq-grant-calculator
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Project structure

No frameworks and no backend: plain HTML, CSS and JavaScript. Routing is hash-based (`#/...`), so nothing needs to be configured on the server.

```
.
├── index.html              # entry point, header, script includes
├── app.js                  # router, page rendering, i18n (RU/KK), "My application"
├── styles.css              # styles, themes, responsive layout
├── assets/
│   └── logo.webp
├── docs/
│   └── screenshots/        # images for this README
└── data/                   # the generated dataset (do not edit by hand)
    ├── specialties.json              # specialties: RU/KK names, subject pairs, grant counts
    ├── universities.json             # universities: region, dormitory, military dept., thresholds
    ├── paths.json                    # specialty × university: general competition and rural quota
    ├── order_quota_paths.json        # pedagogical, technical, Western quotas and "Serpin"
    ├── group_paths.json              # group quotas (orphans, large families, etc.)
    ├── ped_quota_info.json           # pedagogical quota reference
    ├── rural_quota_specialties.json  # specialties that have a rural quota
    └── ent_distribution.json         # UNT score distribution by subject pair
```

Browser state (`localStorage`):

| Key | What it stores |
|---|---|
| `lang` | Interface language (`ru` / `kk`) |
| `theme` | Theme (`light` / `dark`), light by default |
| `dostyq_application` | Contents of "My application" |

## How the chance is calculated

The frontend does not compute the formula. Every path in `data/*.json` carries a precomputed `probability_curve` array, indexed by UNT score (0…140). The site just reads the value at your score.

The curve is built by a Python dataset builder, following this scheme:

```
 winners' scores history 2023–2025
            │
            ▼
   yearly passing score (the lowest winner's score)
            │
            ▼
   trend over the years (needs ≥ 3 years, otherwise trend = 0)
            │
            ├── adjustment for the change in grant count 2025 → 2026
            ├── adjustment for pressure from strong applicants in the subject pair
            ▼
   forecast passing score for 2026
            │
            ▼
   p = 1 / (1 + exp(−k · (your_score − forecast)))
            │
            ▼
   smoothing: within a specialty, the chance never grows as the admission threshold grows
```

- At a score exactly equal to the forecast, the chance is about 50%.
- The steepness `k` grows with the density of winners near the threshold and shrinks with the volatility of the history.
- For the rural quota, the forecast cannot be higher than for the general competition.
- If the latest year had fewer than 5 winners, the path is marked "low data".

### Model limitations

- The model is anchored on the **lowest** winner's score of each year. A single winner with a low score (for example, someone with a privilege) can pull the forecast down.
- The admission threshold (which filters universities) and the winners' history (which drives the probability) come from different sources and are not cross-checked against each other.
- Medical universities (Ministry of Health state order) have no winners' history, only thresholds.
- Specialty × university pairs that a university no longer admits to according to current data are excluded.

## Data sources

| Source | What it provides |
|---|---|
| Grant winner lists 2023, 2024, 2025 (PDF) | Winners' scores, the basis of the history and the probability |
| University threshold scores 2026 (xlsx) | Admission threshold for the competition, used to filter universities |
| Grant counts 2024–2025 and 2026–2027 (xls/docx) | Number of places, adjustment for the change in competition |
| Profile subject pair mapping (xlsx, 2024) | Subject pairs per specialty, RU/KK names |
| UNT score distribution by subject pair (National Testing Center, 2025–2026) | Competition panel |
| testcenter.kz | Quotas: technical and agricultural, "Serpin" |
| eduser.app, edutest.kz | Regions, dormitories, military departments, Kazakh names, pedagogical quota and missing years |

Only aggregates (passing score, min, max, median, number of winners) go into the public dataset. Winners' names and personal IDs never leave the builder, which checks for this before export.

## Updating the data

The dataset builder (Python) is not part of this repository. It reads the source PDF, xls and xlsx files, merges them, computes the probability curves and writes 8 JSON files, which are then copied into `data/`.

To run it you need Python 3 and these packages:

```bash
pip install pymupdf pandas lxml openpyxl python-docx rapidfuzz requests selenium
python3 build_dataset.py
```

The scrapers (testcenter.kz, eduser.app, edutest.kz) use Selenium, so Chrome is required.

After a rebuild, the new files are placed in `data/` and committed together with the site code.

## Deployment

The site is published with GitHub Pages from the `main` branch, repository root. A push to `main` triggers a rebuild.
