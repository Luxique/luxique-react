# HANDOFF — Course Landing v3 + Builder Rebuild + Dynamic Coupling

> **Doel van dit document:** een verse sessie van George (of een andere dev) moet dit kunnen lezen en exact begrijpen wat er de afgelopen weken is gebouwd, hoe het in elkaar steekt, welke valkuilen we al geraakt hebben, en wat er nog moet gebeuren — zonder kennis te verliezen. Geschreven na een lange debug- en bouwgeschiedenis. Lees dit volledig voordat je begint te bouwen.

> **Gouden regel die we duur hebben geleerd:** schema en code lopen in dit project constant uit sync ("schema drift"). Bijna elke bug die ons uren kostte was een kolom die de code verwachtte maar die niet (of anders) in de database stond. **Verifieer altijd het echte schema voor je query's schrijft of een migration draait.** Gok nooit kolomnamen.

---

## 1. PROJECT & INFRASTRUCTUUR

**Wat:** luxique.nl — een lash academy + treatment booking website voor Chiva Daams (lash school + studio in Arnhem). Twee kanten: (1) publieke marketing site + treatment booking, (2) een online leeromgeving (Academy) met cursussen, lessen, video, quizzes.

**Stack:**
- **Next.js 14.2.35** (App Router)
- **Supabase** (Postgres + Auth + Storage + RLS) — project ref `osldoolmbpqayxhgmbum`
- **Mux** (video hosting/streaming) — free plan, bijna vol
- **Vercel** (hosting/deploy) — project `luxique-next`, gekoppeld aan GitHub repo `Luxique/luxique-react`
- **Stripe** (betalingen — webhook route bestaat, checkout flow nog niet af)

**Repo:** `github.com/Luxique/luxique-react`
**Vercel project:** `vercel.com/luxique-9488s-projects/luxique-next`
**Domein:** luxique.nl (www.luxique.nl)
**George werkt lokaal op:** `/Users/georgeai/Projects/luxique-next` (Mac Mini M4, model zai/glm-5.1)

**Belangrijke beperking van George's omgeving:** George kan Vercel NIET in de browser bereiken vanaf de Mac Mini (SSRF-restrictie) en heeft geen Vercel API-token. Alle handmatige Vercel-acties (redeploys, settings) moet CJ doen. George werkt via git push; Vercel deployt automatisch op push naar `main` (webhook werkt sinds 20 mei weer, na een lange storing).

**Design tokens (heilig, overal consistent gebruiken):**
- `--gold: #C4A265`
- `--cream: #FAF8F4`
- `--dark: #0C0A07`
- Fonts: **Cormorant Garamond** (serif/display, vooral italic voor accenten) + **Outfit** (UI/sans)
- Gap: 14px, border-radius: 22px (grote elementen)

**Belangrijke ID's:**
- CJ user id: `fcbd701d-8968-4ce2-aaa0-a65496cfefa4`
- CJ email (admin): `curtis.jr.w@live.com`
- Chiva email (admin): `luxiquelashes@gmail.com` — LET OP: ten tijde van de RLS-migratie had Chiva nog geen account; check of haar account inmiddels bestaat en role_level=100 heeft
- Test course "Medusa Lash Basics": id `90bf2598-a93c-4e7c-9c4d-c971a5b80a86`, slug `medusa-lash-basics`

---

## 2. ROLLEN & RLS (de fundering — sinds commit d4dc511, 20 mei)

Er is een 5-lagen rollensysteem via `profiles.role_level` (smallint):

| Rol | role_level | Toegang |
|-----|-----------|---------|
| prospect | 0 | Account, geen aankoop. Ziet course overview + lessen met `is_free=true` |
| client | 10 | Heeft een treatment booking gedaan. Course-toegang = zelfde als prospect |
| vip_client | 20 | Door admin toegekend. Later: 24u eerder afspraken boeken. Course-toegang = client |
| student | 30 | Heeft ≥1 course gekocht (enrolled). Toegang tot die courses via `enrollments` |
| admin | 100 | CJ + Chiva. God mode: alle courses (published + concept), builder, preview-als-student |

**Cruciaal:** course-content-toegang loopt via de `enrollments` tabel (per course), NIET via role_level. Role bepaalt admin/algemene rechten; enrollment bepaalt welke specifieke courses een student mag zien.

**Helper functions in Postgres** (gebruikt in RLS policies):
- `is_admin()` → `role_level >= 100`
- `has_role_level(min_level int)`
- `is_enrolled(course_id uuid)` → checkt `enrollments` waar `status = 'active'`

**RLS policies bestaan op:** courses, lessons, blocks, enrollments, profiles. Kort samengevat:
- **courses**: SELECT als `status = 'published'` OR `is_admin()`; write alleen admin
- **lessons**: SELECT als admin, OF (les is `is_free` van published course), OF (enrolled in die course); write alleen admin
- **blocks**: SELECT volgt lesson-access; write alleen admin
- **enrollments**: user ziet eigen, admin ziet alle; write admin (of Stripe webhook met service role)
- **profiles**: user ziet/update eigen, admin ziet alle; role_level alleen door admin

**Signup trigger** `handle_new_user()`: maakt automatisch een `profiles` row (id, email, role_level=0) bij nieuwe auth.users signup.

Migration file: `supabase/migrations/20260520_roles_and_course_landing.sql`

### ⚠️ LANDMIJN 1 — `status` vs `is_published`
De `courses` tabel heeft ZOWEL een `status` (text, waarde 'draft'/'published') ALS een `is_published` (boolean) kolom. Dit is dubbele/conflicterende logica.
- **De RLS policies gebruiken `status = 'published'`** — dit zit hard ingebakken in courses_select, lessons_select, blocks_select.
- **De applicatiecode/afspraak gebruikt `is_published`.**
- We hebben eerder een 404-bug gehad doordat een course `status='draft'` had maar `is_published=true` (of andersom).

**Wat dit betekent voor jou:** als je een course publiceert, moet je BEIDE zetten (`status='published'` EN `is_published=true`), anders matcht of de RLS niet (course onzichtbaar voor niet-admins) of de app-logica niet (404). Idealiter consolideren we naar één bron, maar dat is nog niet gebeurd. Tot die tijd: houd ze in sync. Dit is een bekende schuld.

### ⚠️ LANDMIJN 2 — `role` (text) vs `role_level` (smallint)
De `profiles` tabel heeft nog een oude `role` (text) kolom NAAST de nieuwe `role_level` (smallint). De oude `role` wordt niet meer gebruikt door de nieuwe RLS maar is nooit opgeruimd. Negeer `role`, gebruik `role_level`. Kan later weg in een opschoonmigratie.

### ⚠️ LANDMIJN 3 — admin bootstrap
Na de RLS-migratie start elke user op `role_level=0`. CJ is handmatig op 100 gezet. Als je ooit de profiles tabel reset of een nieuwe migratie draait die role_level beïnvloedt: zorg dat CJ (en Chiva) weer admin worden, anders sluit je jezelf buiten de builder. De bootstrap-SQL:
```sql
UPDATE profiles SET role_level = 100
WHERE id IN (SELECT id FROM auth.users WHERE email IN ('curtis.jr.w@live.com', 'luxiquelashes@gmail.com'));
```

---

## 3. DATA MODEL — COURSES, LESSONS, BLOCKS

### courses (volledige kolommenlijst, geverifieerd 29 mei)
| Kolom | Type | Notitie |
|-------|------|---------|
| id | uuid | PK |
| title | text | |
| slug | text | NOT NULL — was ooit een save-bug bron |
| description, short_description | text | short = tagline op cards |
| thumbnail_url | text/null | |
| price_cents | int | **de bron van waarheid voor prijs.** 199700 = €1997 |
| currency, level, duration_text | text | |
| is_published | bool | zie LANDMIJN 1 |
| sort_order | int | |
| stripe_price_id | text/null | **bestaat al!** null voor Medusa tot eerste Stripe sync |
| is_first_lesson_free | bool | |
| intro_video_mux_id | text/null | |
| thumbnail_time | int | |
| certificate* / final_quiz_required | mixed | |
| hero_image_url, hero_video_url | text/null | |
| hero_mux_playback_id, hero_mux_asset_id | text/null | |
| long_description | text/null | |
| what_you_learn | jsonb | OUDE landing-veld, zie hieronder |
| who_is_it_for | text/null | OUD landing-veld |
| gallery_urls | jsonb | |
| landing_blocks | jsonb | flex blokken, leeg `[]` voor Medusa |
| differentiators | jsonb | 3 items met {icon, title, body} — bestaat al gevuld |
| price | float | **REDUNDANT** met price_cents — negeren, niet gebruiken |
| status | text | zie LANDMIJN 1 — 'draft'/'published' |

**+ v3 migration (20260529_course_landing_v3.sql) voegt toe:**
hero_badge_text, hero_title, hero_title_accent, hero_title_suffix, hero_tagline, hero_cta_text, hero_social_proof, hero_chips (jsonb), differentiators_eyebrow, differentiators_title, curriculum_eyebrow, curriculum_title, curriculum_intro, reviews_eyebrow, reviews_title, access_duration_text (default '12 maanden toegang'), pricing_includes (jsonb), final_cta_eyebrow, final_cta_title, final_cta_title_accent, final_cta_lead, final_cta_button_text

### lessons (geverifieerd)
id, title, slug, description, video_url, mux_playback_id, mux_asset_id, duration_seconds, content, sort_order, is_free, course_id, created_at, updated_at
**+ v3 migration voegt toe:** `what_you_learn_text` (text) — de korte "wat leer je in deze les" beschrijving die in de curriculum-accordion op de landing verschijnt.

### blocks
Hangen aan een lesson via `lesson_id`. Hebben `course_id`, content (jsonb), type, sort_order. Dit is het flexibele blokken-systeem voor LES-inhoud (niet voor de landing page).

### ⚠️ LANDMIJN 4 — `duration_minutes` bestaat NIET
De lessons tabel heeft `duration_seconds`, niet `duration_minutes`. Code die `duration_minutes` query't krijgt een 400 (Bad Request, column does not exist). Dit was een bug die wij hebben gefixt — als je het ergens terugziet, query `duration_seconds` en reken client-side om (`/60`).

### ⚠️ LANDMIJN 5 — `module_id` is verwijderd
Er was ooit een `module_id` NOT NULL kolom op lessons (legacy concept van "modules" boven lessen). Die is gedropt (CASCADE — nam ook een oude "Enrolled lessons" RLS policy mee die via modules ging). Er zijn GEEN modules meer in dit datamodel. Lessen hangen direct aan een course via `course_id`. Herintroduceer geen modules.

### ⚠️ LANDMIJN 6 — de "global context → les 1" workaround is verwijderd
Tijdens de save-bug saga (zie sectie 6) maakte een noodfix automatisch "Les 1" aan en synced content uit de "Cursus overzicht" context daarheen. Dat was conceptueel fout en is verwijderd toen course-landing-content naar de courses-tabel verhuisde. Course landing = data op de `courses` row. Lesson content = blocks op een lesson. Houd die twee strikt gescheiden.

---

## 4. DE LIVE COURSE LANDING PAGE (huidige werkende staat)

**Route:** `/cursus/[slug]` — bv. `/cursus/medusa-lash-basics`
**Bestanden:**
- `src/app/cursus/[slug]/page.tsx` — server component. Doet `supabase.from('courses').select('*')` op slug. Geen mapping-laag.
- `src/app/cursus/[slug]/CourseLandingClient.tsx` — client renderer. Leest `course.hero_title`, `course.hero_tagline`, `course.differentiators`, `course.pricing_includes`, `course.curriculum_intro` etc. **rechtstreeks** uit het course object. Geen transformatie ertussen.

**Belangrijk:** dit is een aparte, NIEUWE landing page (gebouwd in Fase 2, commit 7b7cef3 en later). Het is NIET dezelfde als de oude `/courses/[slug]` route die mogelijk nog bestaat. Verwar ze niet.

**Design (v3):** dark premium thema. Organic moving dark-to-gold gradient achtergrond (body::before, ~28s drift animatie, blur). Content-boxes semi-transparant met backdrop-blur zodat de gradient erdoorheen schemert. Secties in volgorde:
1. **Hero** — badge, titel (3-delig: title + accent + suffix), tagline, hero media (Mux video of afbeelding), floating chips, CTA, social proof. Centered.
2. **Differentiators** — eyebrow + titel + 3 cards (icon/title/body)
3. **Flex blokken** (uit landing_blocks) — tussen differentiators en curriculum
4. **Curriculum** ("Wat ga je leren") — eyebrow + titel + intro + **accordion lessenlijst** (lessen uit `lessons` tabel, klik open → `what_you_learn_text`). Eerste les open by default. Gratis/lock badge per les.
5. **Reviews** — eyebrow + titel + 3-6 reviews uit homepage bron (zie sectie 5), nieuwste eerst, met Google/Treatwell label
6. **Pricing** — €1997, "12 maanden toegang", pricing_includes lijst, CTA, payment logos (VISA/Mastercard/iDEAL/Apple Pay/Klarna)
7. **Final CTA** — eyebrow + titel + accent + lead + button

**Prijs:** €1997 (price_cents = 199700). LET OP: dit is bewust een factor 10 hoger dan de oude €197 — premium positionering. Niet "corrigeren" naar 197.

### Flex blokken (landing_blocks jsonb)
De live renderer ondersteunde oorspronkelijk 8 types. **In v3 zijn dat er 6:**
`founder_story`, `pain_points`, `quote`, `rich_text`, `image_text`, `video_caption`
De twee vervallen types: `what_you_learn` (nu samengevoegd in de curriculum-sectie) en `testimonials` (nu samengevoegd in de reviews-sectie). Als oude data die types bevat: skip/negeer ze in de renderer.

Format (indicatief — verifieer de echte structuur in CourseLandingClient.tsx):
```json
[
  { "type": "founder_story", "title": "...", "body": "...", "image_url": "..." },
  { "type": "pain_points", "title": "...", "items": ["...", "..."] },
  { "type": "quote", "text": "...", "author": "..." },
  ...
]
```

### Deel A fixes (commit 8b763c5, al live)
- Hero spacing: titel rendert nu als `{hero_title}{' '}<span>{accent}</span>{' '}{suffix}` met spaties (de oude split-logica was fout)
- Hero centering: text-center toegevoegd
- Gold glow versterkt (hero radial 0.22, bg gradient + pricing card)
- Review labels toegevoegd MAAR met emoji (💇 Treatwell / 🔍 Google) — **dit moet nog veranderen naar echte mini-logo's of strakke tekst-pills, emoji is niet premium genoeg**

### ⚠️ LANDMIJN 7 — HTML mockup ≠ React styling
De v3 mockup (`luxique-course-landing-v3.html`) is plain CSS met een `<style>` blok en class-selectors. Toen die naar React werd omgezet laadde de styling eerst NIET (kale pagina, gekleurde balken). De data-flow werkte wel. Les: een mockup is een visuele blueprint; de styling moet opnieuw geïmplementeerd worden in het styling-systeem van het project (check of dat Tailwind, CSS-modules of styled-components is). Plain CSS classes renderen niet vanzelf.

---

## 5. REVIEWS BRON

- Er bestaat een `reviews` tabel in Supabase, maar die is **leeg**.
- De homepage reviews staan **hardcoded** in `ReviewsSection.tsx` als een const array (10+ reviews).
- Elke review heeft een `source: 'google' | 'treatwell'` veld (nu allemaal treatwell). Dit veld voedt het Google/Treatwell label.
- Er is GEEN testimonials tabel.

**Afspraak voor nu (bewust pragmatisch):** geen tabel-migratie. De reviews const wordt verplaatst naar een gedeeld bestand (bv. `lib/reviews.ts`) en geïmporteerd op zowel de homepage als de course landing. Course landing toont 3-6 reviews, nieuwste eerst. Later migreren we naar de `reviews` tabel als één centrale, door-Chiva-beheerbare bron — dat is bewust uitgesteld (scope).

---

## 6. DE SAVE-BUG SAGA (waarom dit project gevoelig is voor schema drift)

Op 20 mei kostte één bug een halve dag. Het is leerzaam omdat het patroon zich blijft herhalen. De keten van oorzaken, in volgorde van ontdekking:
1. "Concept opgeslagen!" toast verscheen maar content was weg na refresh. `lessonCount: 0` in de logs.
2. Eerst verdacht: RLS. Bleek niet — RLS geeft 401/403, wij zagen 400.
3. 400 = Bad Request = kapotte query. Oorzaak 1: `lessons` tabel miste `course_id` kolom volledig → filter `course_id=eq.xxx` faalde.
4. Oorzaak 2: `module_id` NOT NULL constraint blokkeerde lesson-inserts (kolom werd niet meegestuurd). Opgelost door module_id te droppen (CASCADE).
5. Oorzaak 3: `slug` NOT NULL werd niet meegestuurd.
6. Oorzaak 4: code query'de `duration_minutes`, kolom heet `duration_seconds`.
7. Oorzaak 5 (de grootste): de "Cursus overzicht" globale context had geen bijbehorende lesson, dus blokken gingen nergens heen. Noodfix maakte auto-Les-1 aan. Later goed opgelost door landing-content naar de courses-tabel te verhuizen.

**De moraal:** elke keer was het schema dat niet matchte met wat de code verwachtte. Daarom: bij ELKE nieuwe query of migration eerst `information_schema.columns` checken. Postgres rolt failed migrations netjes terug (transactie), dus een mislukte migration is veilig — maar voorkomen is sneller.

---

## 7. WAT NU MOET GEBEUREN — DEEL B: BUILDER REBUILD

### Het kernprobleem
De admin builder op `src/app/admin/courses/[id]/builder/page.tsx` schrijft naar OUDE kolommen (`title`, `short_description`, `what_you_learn`, `who_is_it_for`, `price_cents`), terwijl de live page leest uit NIEUWE kolommen (`hero_title`, `hero_tagline`, `curriculum_intro`, `pricing_includes`, etc.). **Ze zijn volledig losgekoppeld** — wijzigingen in de builder verschijnen niet op de live page.

Bovendien: de builder-preview is een aparte simpele `renderPreview()` functie (rond regel 994 in `page.tsx`), NIET de echte `CourseLandingClient`. Daarom toont de preview "Geen blokken toegevoegd" en lijkt hij nergens op de echte pagina.

### Wat Deel B moet doen
**B1 — CourseLandingClient prop-based maken.** Refactor zodat hij een `course` object als prop accepteert (i.p.v. zelf data te fetchen). Live page voedt het uit Supabase; builder voedt het uit live form-state. Zelfde component = preview gegarandeerd 1:1 met live. Optioneel een `previewMode` prop om zware animaties (moving gradient) in het smalle preview-paneel uit te zetten — structuur/content/styling blijven identiek.

**B2 — Builder sectie-kaarten die naar de NIEUWE kolommen schrijven.** Vervang de oude veldenlijst (Cursustitel, Korte beschrijving, Prijs, Wat leer je, Voor wie) door sectie-kaarten die 1:1 de live secties spiegelen. Zie `luxique-builder-mockup.html`. Per kaart het volledige veld-mapping naar nieuwe kolommen:
- **Hero** → hero_badge_text, hero_title, hero_title_accent, hero_title_suffix, hero_tagline, hero_cta_text, hero_social_proof, hero_chips (jsonb), hero media (Mux → hero_mux_playback_id / hero_image_url)
- **Differentiators** → differentiators_eyebrow, differentiators_title, differentiators (jsonb {icon,title,body}, reorderbaar)
- **Flex blokken** → landing_blocks (jsonb, 6 types, DnD, dupliceer, verwijder)
- **Curriculum** → curriculum_eyebrow, curriculum_title, curriculum_intro (+ note: lessen komen auto uit lessons tabel)
- **Reviews** → reviews_eyebrow, reviews_title (+ note: reviews komen auto uit homepage bron)
- **Pricing** → price_cents (euro-input → cents, hint "wordt naar Stripe gezet"), level, access_duration_text, pricing_includes (jsonb, reorderbaar)
- **Final CTA** → final_cta_eyebrow, final_cta_title, final_cta_title_accent, final_cta_lead, final_cta_button_text
- **Settings** → is_first_lesson_free, intro video toggle, final_quiz_required, certificate toggle

**B3 — Preview vervangen.** Verwijder `renderPreview()`. Gebruik de prop-based `CourseLandingClient` met de live form-state. Acceptatietest: hero titel wijzigen → verschijnt direct in preview → staat na opslaan op de live page.

**B4 — Save & Publish + Stripe.**
- Concept opslaan → schrijft alle nieuwe kolommen + landing_blocks
- Publiceren → `is_published=true` EN `status='published'` (zie LANDMIJN 1!) + Stripe prijs-sync: maak/update een Stripe Price van `price_cents`, sla `stripe_price_id` op (kolom bestaat al). Stripe Prices zijn immutable → bij prijswijziging nieuwe Price aanmaken, oude archiveren. Gebruik Stripe Checkout (hosted), niet Payment Element.

**B5 — Nieuwe-cursus pad met defaults (SCALE — cruciaal).** Zie sectie 8.

### Hergebruik
- DnD: `@dnd-kit` is al in gebruik in de lesson-builder (commit `350cbea fix: move SortableBlock to module level`). Hergebruik die code voor flex blokken + reorderbare lijsten.
- Mux upload: bestaande flow via `/api/mux/upload-url`.
- RichTextField: er is een herbruikbare Tiptap rich-text component (B/I/S, kleur, highlight, lijsten) met een `inline` (geen lijsten) en `block` (met lijsten) variant.

---

## 8. SCALE — "content is data, structuur is code"

Dit is het architectuurprincipe dat CJ expliciet wil borgen voordat Chiva veel cursussen heeft.

**Onderscheid EDITABLE vs VAST:**
- **EDITABLE** (per course anders → moet bewerkbaar in builder): elke tekst die een bezoeker leest en die per cursus kan verschillen — alle hero-teksten, differentiator-cards, curriculum eyebrow/titel/intro, reviews eyebrow/titel, pricing-velden, final-CTA-teksten, alle flex-content.
- **VAST/HARDCODED** (structuur, niet editable): sectie-volgorde, layout, styling, kleuren, animaties, UI-labels die geen content zijn, sectie-type-namen.
- **Vuistregel:** zou Chiva het per cursus willen aanpassen → editable. Puur skelet dat altijd gelijk is → hardcoded.

**Nieuwe cursus aanmaken moet over ALLE DRIE de lagen smooth zijn:**
1. **Course landing** — een nieuwe course row krijgt zinnige DEFAULTS op alle nieuwe kolommen (default differentiators, default eyebrows zoals "— Waarom Luxique —", access_duration_text "12 maanden toegang", geldige lege jsonb arrays voor chips/includes/landing_blocks). Een gloednieuwe cursus heeft DIRECT een werkende, presentabele landing — nooit een lege/kapotte staat.
2. **Lessen** — een nieuwe les aanmaken creëert een lesson row met alle benodigde velden (incl. `what_you_learn_text`) gekoppeld aan de juiste course_id; de curriculum-sectie pakt hem automatisch op.
3. **Blokken** — flex/lesson blokken worden met geldige structuur in de juiste jsonb kolom aangemaakt, voor elke course, zonder course-specifieke code.

**Concreet:**
- Bevestig of er een "nieuwe cursus aanmaken" pad bestaat. Zo niet: bouw het (course row met alle defaults → direct de builder in).
- Builder, lesson-editor en blok-systemen moeten werken voor ELKE course id. Geen hardcoded course-specifieke logica.
- Schema zo bouwen dat een kolom later toevoegen één migration is die voor alle bestaande courses een default zet.
- **Doel:** over 6 maanden heeft Chiva 10 cursussen, elk met volledig bewerkbare landing + lessen + blokken, zonder dat een dev per cursus code aanraakt.

---

## 9. WERKWIJZE & VOLGORDE

Branch: `feature/course-landing-v3`. Werk gefaseerd, push na elke stap, CJ checkt op Vercel preview + mobiel screenshot voordat je verder gaat. Dit is je beste bescherming tegen half-werk en schema-drift.

Volgorde:
1. (al gedaan) Deel A live-page fixes — commit 8b763c5
2. Emoji review-labels → echte logo's/pills (klein, kan mee in B1 of los)
3. B1 — CourseLandingClient prop-based refactor (live page blijft werken)
4. B2 — builder sectie-kaarten naar nieuwe kolommen
5. B3 — preview vervangen door echte CourseLandingClient
6. B4 — save/publish + Stripe sync
7. B5 — nieuwe-cursus pad met defaults over landing + lessen + blokken

**Twee succesvoorwaarden voor "klaar":**
- (a) Hero titel wijzigen in builder → verschijnt in preview → staat na opslaan op live page
- (b) Nieuwe cursus aanmaken → direct werkende landing met defaults → volledig bewerkbaar

---

## 10. OPEN PUNTEN / TECHNISCHE SCHULD (niet vergeten)

- **status vs is_published consolideren** (LANDMIJN 1) — voorlopig allebei in sync houden, ooit naar één bron
- **oude `role` text-kolom** op profiles opruimen (LANDMIJN 2)
- **price float** kolom is redundant met price_cents — ooit droppen
- **Reviews naar centrale tabel** migreren (nu hardcoded/gedeeld bestand)
- **Stripe checkout flow zelf** (success → enrollment INSERT via webhook met service role) — aparte ticket na de builder
- **Course overview page** (alle course-cards, dynamisch, "coming soon" als niets published) — aparte ticket
- **Quiz rebuild** — architectuur al besloten 20 mei (4 vraagtypes: MC/waar-onwaar/open/sleep-sorteer; 80% drempel instelbaar; quiz_attempts + quiz_answers tabellen; herkansing; eindscherm-summary). Nog NIET gebouwd.
- **Sidebar les/quiz/eindtoets selector** in builder — onderdeel van quiz rebuild
- **Mux free plan bijna vol** — oude assets opruimen
- **Test commit 719802a** ("test: trigger Vercel deploy") staat nog in main history — ooit opruimen
- **RLS na launch verstrengen** — de huidige policies zijn redelijk, maar dubbelcheck voor launch dat niet-enrolled studenten geen betaalde content kunnen zien
- **VIP afspraken-voorrang** (24u eerder boeken) — komt pas met de booking flow

---

## 11. COMMIT-GESCHIEDENIS (referentie)
- 20 mei keten: cc46673 → c8f3c95 → 350cbea (SortableBlock module-level, DnD) → d559819 (Tiptap + slug fix) → 719802a (test deploy) → 62e2fc1 → f026e41 (debug logging) → a267c58 (auto-les-1 noodfix) → 35bf0b7 (course_id + slug) → **d4dc511 (roles + RLS + course landing kolommen — de grote migration)**
- v3 werk: 7b7cef3 (Fase 2 live page) → ... → 562ef4a → 304bb0c → **8b763c5 (Deel A live-page fixes)**

---

*Einde handoff. Bij twijfel over schema: verifieer tegen information_schema voordat je query't. Bij twijfel over architectuur: content is data, structuur is code. Werk gefaseerd, push klein, laat CJ checken.*
