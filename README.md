# Loreline

**Turn your world's history into a fast, searchable website you own.**

**[See the live demo →](https://peppybug.github.io/loreline/)**

Loreline is for novelists, game masters and game designers who keep the history of an invented world. You write
plain Markdown files, one per event, person, place or faction. Loreline turns them into a website with:

- **A zoomable timeline** with a row for each region and your eras across the top. Point anywhere to see
  everything that was happening at that moment.
- **Cause and effect.** Say what led to what, and every event page shows what came before and what happened
  next. There's also a connections map you can explore step by step.
- **Your own calendar.** "412 AT", "TA 3019", "88 BT", with your own month names.
- **[[Wiki links]].** Write `[[Queen Isembard]]` in any text and it becomes a link. Mistyped names are flagged.
- **Instant search** that forgives typos and understands years in your calendar ("88 BT").
- **An interactive map**: drop in your map image and give places a position.
- **Pages for every person, place and faction**, listing everything they were part of, worked out for you.
- **Light and dark mode**, phone-friendly layouts and keyboard accessibility.
- **A checker** that reads every file and tells you exactly what's wrong, in plain English, before you publish.

The result is a static site: no database, no server, no monthly fee. Host it free on GitHub Pages, Netlify or
Cloudflare Pages, or upload it anywhere that serves files.

The demo world in `world/` (*The Drowned Crown*) shows every feature. Replace it with your own.

---

## Quick start

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Edit any file in `world/` and refresh the page to see the change.

## Your world, in four folders

```
world/
  world.yml        Name, calendar, eras, regions, categories, map
  events/          One file per event
  people/          One file per person
  places/          One file per place
  factions/        One file per house, order, guild, nation…
public/            Images and your map
```

The file name is the page's address: `world/events/battle-of-greywater.md` becomes `/event/battle-of-greywater/`,
and other files refer to it as `battle-of-greywater`. Use lowercase letters, numbers and dashes.

To start a new file from a template:

```bash
npm run new event "Battle of the Pass"
```

The same works for `person`, `place` and `faction`.

### An event

```markdown
---
title: Battle of Greywater
date: "133-07-02"            # year-month-day in your calendar
region: saltreach            # a region slug from world.yml
category: war                # a category slug from world.yml
summary: The Compact's fleet slips behind the Claimant's ships and destroys them.
places: [greywater]
people:
  - { slug: tamsin-ord, role: Admiral of the Compact }
  - corwen-the-claimant
factions: [saltreach-compact]
led_to:
  - treaty-of-lantern-rock
  - to: rise-of-the-hollow-court
    note: An optional sentence explaining the link.
---

Write the story here, in Markdown. Link to anything by name: [[Tamsin Ord]], [[Greywater Sound]].
Use [[Tamsin Ord|the admiral]] to change the link text.
```

**Dates.** `"412"` is a year, `"-80"` is 80 years before year 1, `"412-03"` adds a month, `"412-03-14"` adds a day,
and `"~300"` means "about 300". Add `end:` for events that lasted a while. There is no year zero.

**Connections**, each a list of event file names:

| Field | Meaning | Drawn as |
| --- | --- | --- |
| `led_to` | This directly caused it | solid line |
| `contributed_to` | This was one of its causes | dashed line |
| `followed_by` | It came next, without being caused by this | dotted line |
| `part_of` | This is part of a bigger event | listed as related |
| `related_to` | Linked by theme | listed as related |

You only write each link once. "Caused by", "Preceded by" and the rest are worked out for you.

**Other optional fields** on every kind of file: `aliases` (other names, used by search and wiki links),
`image` (a path inside `public/`, e.g. `images/battle.jpg`), `image_alt`, `image_credit`, `featured: true`
(shown on the home page), `tags`, and `draft: true` (checked, but not published).

### People, places and factions

```yaml
# world/people/tamsin-ord.md
name: Tamsin Ord
title: Admiral of the Compact   # one line, shown under the name
born: "96"
died: "171"
factions: [saltreach-compact]

# world/places/greywater.md
name: Greywater Sound
kind: Strait
region: saltreach
map: [44, 52]                   # percent from the left, percent from the top of your map

# world/factions/saltreach-compact.md
name: The Saltreach Compact
kind: Merchant league
founded: "22"
color: "#2e7d6b"                # used for its members' badges
```

The pages list the events each one appears in, and a faction's page lists its members. You don't write those lists.

### world.yml

Open `world/world.yml`: every setting is explained in it. The ones you'll want first:

- `name`, `tagline`, `intro`: your home page.
- `calendar`: labels for the years after and before year 1, whether the label goes before or after the number,
  and your month names.
- `eras`: named ages with start and end years. Events are placed in an era automatically.
- `regions` and `categories`: the timeline has one row per region. Categories are its filter.
- `accent`: the site's main colour.
- `map`: your map image (in `public/`), with its width and height in pixels.

## Checking your world

```bash
npm run check
```

This reads every file and reports problems, such as a link to a place that doesn't exist, a date that can't be
read or a typo in a region name, with the file and a suggestion:

```
world/events/battle-of-greywater.md
  error   `places`: there's no place called "merow". Did you mean "merrow"?
  warning [[Queen Isembrad]] doesn't match any page yet. Did you mean "queen isembard"?
```

Errors stop the site from building. Warnings don't.

## Publishing

```bash
npm run build
```

This checks your world and writes the finished site to `out/`. Upload that folder to any web host, or preview it
with `npm run preview`.

### GitHub Pages (free)

1. Put this folder in a new GitHub repository and push it to the `main` branch.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

Every push publishes the site at `https://<you>.github.io/<repository>/`. The included workflow
(`.github/workflows/deploy.yml`) handles the sub-folder address for you.

### Netlify or Cloudflare Pages

Set the build command to `npm run build` and the output directory to `out`.

### A sub-folder of your own site

If the site won't be at the root of its domain, set `BASE_PATH` when building:

```bash
BASE_PATH=/my-world npm run build
```

## Making it yours

- **Colours and fonts** are in `src/app/globals.css`. Each colour is one variable, with a light and a dark value.
- **Hide the credit**: set `credit: false` in `world.yml`.
- **Change the pages** in `src/app/`: they're React components (Next.js).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Live preview at localhost:3000 |
| `npm run new <kind> "Name"` | Create a new event, person, place or faction |
| `npm run check` | Check every file for problems |
| `npm run build` | Check, then build the site into `out/` |
| `npm run preview` | Serve the built site locally |
| `npm test` | Run the tests |
