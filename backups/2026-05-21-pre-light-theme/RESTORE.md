# Backup: Pre Light Theme Experiment

**Datum:** 29 mei 2026 (2026-05-29)
**Git commit hash:** `9289ffe`
**Branch:** main

## Wat is gebackupt

Alle bestanden die de homepage beïnvloeden:
- `src/app/page.tsx` — homepage layout
- `src/app/globals.css` — globale CSS tokens & styles
- `tailwind.config.ts` — tailwind configuratie
- Alle homepage componenten:
  - Hero.tsx, TechVsArtist.tsx, EyeShapes.tsx, Missie.tsx
  - BeforeAfter.tsx, MeetChiva.tsx, ReelsSection.tsx
  - ComparisonTable.tsx, AcademyHomeSection.tsx, ReviewsSection.tsx
  - FAQ.tsx, Navbar.tsx, Footer.tsx, ThemeColorManager.tsx

## Hoe te restoren

### Optie 1: Git checkout (aanbevolen)
```bash
git checkout 9289ffe -- \
  src/app/page.tsx \
  src/app/globals.css \
  tailwind.config.ts \
  src/components/Hero.tsx \
  src/components/TechVsArtist.tsx \
  src/components/EyeShapes.tsx \
  src/components/Missie.tsx \
  src/components/BeforeAfter.tsx \
  src/components/MeetChiva.tsx \
  src/components/ReelsSection.tsx \
  src/components/ComparisonTable.tsx \
  src/components/AcademyHomeSection.tsx \
  src/components/ReviewsSection.tsx \
  src/components/FAQ.tsx \
  src/components/Navbar.tsx \
  src/components/Footer.tsx \
  src/components/ThemeColorManager.tsx
```

### Optie 2: File copy vanuit backup map
```bash
cp backups/2026-05-21-pre-light-theme/page.tsx src/app/page.tsx
cp backups/2026-05-21-pre-light-theme/globals.css src/app/globals.css
cp backups/2026-05-21-pre-light-theme/tailwind.config.ts tailwind.config.ts
cp backups/2026-05-21-pre-light-theme/*.tsx src/components/
```

Na restore: `git add -A && git commit -m "restore: homepage to pre-light-theme backup (2026-05-29)"`
