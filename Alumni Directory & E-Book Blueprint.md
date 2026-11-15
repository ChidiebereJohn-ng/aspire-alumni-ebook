# Alumni Directory & E-Book Blueprint

Aspire for Excellence Foundation · Build-ready architecture and design system for Antigravity

## 1. Design system

**Brand read:** The logo is warm and aspirational: a teal figure reaching for a gold star, set in an elegant serif. The product should feel like a graduation yearbook crossed with a modern professional network: dignified, bright, and uncluttered.

### Palette

The teal was sampled from the logo file. The red and gold are matched by eye, so swap in the brand hex codes if you have them.

| Role | Color | Hex |
| --- | --- | --- |
| Primary (buttons, links, headers) | Logo teal | `#148D93` |
| Accent (highlights, cohort badges) | Star orange | `#F7822D` |
| Gold (star motifs, dividers) | Warm gold | `#F5A623` |
| Heading emphasis | Logo red | `#D63A3F` (use sparingly) |
| Text | Deep charcoal | `#1F2A30` |
| Page background | Warm off-white | `#FBF8F4` |
| Cards | White | `#FFFFFF` |
| Soft teal tint (section backgrounds) | Light teal | `#E6F4F4` |

Use teal as the dominant color. Orange and gold are for small moments only. Red appears only in the cover title and cohort headings, as in the logo's wordmark.

### Typography (Google Fonts)

- Headings: **Cormorant Garamond** or **Playfair Display**, matching the elegant serif feel of the logo
- Body and UI: **Inter** or **DM Sans**
- Cohort labels: small caps with wide letter-spacing, echoing "FOUNDATION" in the logo

### Signature motif

The star. A small gold star marks approved profiles, cohort dividers, and e-book page numbers. Use the teal reaching figure as a watermark on the cover.

### Logo placement

- **Form:** top center, above the title
- **Directory:** header bar, left side, with a thin gold line underneath
- **E-book:** large on the cover, small mark in every page footer
- **Portrait card:** bottom corner

## 2. Surfaces

### Submission form (mobile first, most people will open it from WhatsApp)

- Fields: surname, first name, photo (cropped to a square in the browser so every photo lines up, then compressed), city, state, employer, role, industry, cohort year, optional advice (about 300 characters)
- Consent checkbox: "I agree my details appear in the alumni directory."
- Cloudflare Turnstile spam check, then a thank-you screen with a private edit link

### Admin dashboard (`/admin`, login required)

- Pending queue and an all-entries list: approve, edit, hide, or delete any entry; deleted entries go to a Recently deleted view for 30 days and can be restored
- Master toggles: Directory public, E-book public
- "Generate e-book" for everyone and for a single cohort
- Count of entries per cohort

### Public directory

- Hero with logo and the line "Meet the alumni who came before you."
- Search bar and an "All" filter on one row, with dropdowns for cohort, industry, and state; the grid updates live as people type
- Cards are all the same size and show round photo, name, teal cohort badge, and industry; role, employer, and city appear on the profile page
- Clicking a card opens a profile with their advice
- "Download e-book" button, visible only when enabled

### Portrait card (individual share image)

- Branded card with photo, name, cohort, industry, and logo, so alumni can post it on WhatsApp or LinkedIn
- Downloadable as a PDF from a "Download PDF" button on the card, with a PNG option for WhatsApp

## 3. E-book layout

1. **Cover:** teal background, white logo, gold star, title "Alumni Directory", edition year
2. **Welcome page:** short note from the foundation (text to be supplied)
3. **Table of contents:** organized by cohort
4. **Cohort divider pages:** large year in red serif, gold star rule
5. **Profile pages:** 4 alumni per page in a 2×2 grid, each with photo, name, cohort, industry, and a one-line advice quote (cut to about 100 characters, shown only if provided); the full advice stays on the web profile
6. **Back cover:** logo and contact details

Page footer: small logo, page number inside a gold star.

## 4. Architecture

**Stack:** Cloudflare Pages (frontend), Workers (API), D1 (database), R2 (photos and PDFs), Turnstile (spam protection), and `pdf-lib` in the admin browser (PDF generation).

### Tables

- `alumni`: id, surname, first\_name, photo\_key, city, state, employer, role, industry, cohort\_year (number), advice, status (`pending`, `approved`, `hidden`), edit\_token, consent, created\_at
- `settings`: directory\_public, ebook\_public
- `ebooks`: id, scope (`all` or a cohort year), pdf\_key, generated\_at

### API routes

- `POST /api/submit` and `PUT /api/edit/:token`
- `GET /api/alumni`: public, approved entries only, with query filters
- `GET/POST /api/admin/*`: protected
- `POST /api/admin/ebook`: stores the generated PDF
- `GET /api/ebook/:scope`: only when the toggle is on

### Decisions made

- Both a full e-book and per-cohort editions, since it is cheap now and hard to add later
- Nothing goes public until the admin approves it
- Photos stored as JPEG at about 800px
- Cohort year is a plain number, so 2027 and beyond need no code changes

## 5. Build order for Antigravity

1. Set up the D1 schema, R2 bucket, and Worker skeleton
2. Load the design tokens (palette, fonts) as CSS variables first, so everything inherits them
3. Submission form with photo crop and upload
4. Admin approval dashboard and toggles
5. Public directory with search, filters, and profile pages
6. E-book generator, then portrait card generator
7. Turnstile, edit links, and final polish

**Logo note:** Upload `logo_1.png` into the project. The logo has a white background, so a transparent PNG or SVG would look cleaner on the teal cover. If none is available, place the logo on a white rounded panel on the cover.

## 6. Additional features

These ten features ship with version one, because most are cheap now and painful to retrofit.

### Admin and data

1. **Bulk import and export (CSV).** Cohorts 2021 to 2025 have already graduated, so the admin can upload a spreadsheet of past alumni, add or edit entries on their behalf, and export everything as a backup. Imported entries start as `pending` until approved.
2. **Duplicate check.** A duplicate is the same surname, first name, and cohort, ignoring capitalization and extra spaces. Form submissions that match an existing entry are flagged in the pending queue with a link to the original. CSV imports show a preview before anything is saved, with each row marked New, Duplicate, or Possible duplicate (same name in a different cohort, or a one-letter spelling difference). For each flagged row the admin chooses Skip, Update the existing entry, or Import anyway.
3. **Named e-book editions.** Each generated PDF is saved with a name such as "Edition 2026", so older versions stay available.
4. **Admin stats view.** Submissions per cohort, pending count, e-book downloads, and directory and profile views. Counts only, with no tracking of individual visitors.

### Sharing and links

5. **Link preview for WhatsApp.** The shared link shows the foundation logo, a title, and a one-line description (Open Graph tags, with a 1200×630 preview image in brand colors).
6. **Cohort-prefilled form links.** `/join?cohort=2026` opens the form with the cohort already selected, so each cohort gets its own link and wrong-year entries drop.

### Alumni choices

7. **Privacy choices and removal.** Alumni can hide their employer or city, and a "remove me" option sits on their private edit link. Have someone qualified review the consent wording against the Nigeria Data Protection Act 2023.
8. **Optional LinkedIn field.** Shown on the profile page only. No phone numbers or emails appear in the public directory.

### Directory homepage

9. **Featured alumni strip.** A row of larger cards at the top of the directory. The admin marks entries as featured, and the strip rotates through them.
10. **Alumni by state view.** Tiles for each Nigerian state with the number of alumni, plus an "Outside Nigeria" tile for those abroad. Clicking a tile filters the directory. An SVG map of Nigeria can replace the tiles later without changing the data.

### Data model additions

- `alumni`: linkedin\_url, hide\_employer, hide\_city, featured (yes or no), country (default Nigeria), removed\_at (alumni self-removal), deleted\_at (admin delete, restorable for 30 days), source (`form` or `import`)
- `ebooks`: edition\_name
- `events`: id, type (`ebook_download`, `directory_view`, `profile_view`), cohort\_year, created\_at

### Build order changes

- Add CSV import and export and the duplicate check to step 4, the admin dashboard
- Add cohort-prefilled links and privacy choices to step 3, the submission form
- Add the featured strip and alumni-by-state view to step 5, the public directory
- Add edition names to step 6, then the stats view and link preview in step 7 with the polish work

### Left out on purpose

Alumni logins, messaging, and mentor matching. Each is a separate product with its own moderation needs, and the directory works without them.
