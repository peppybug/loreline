/**
 * npm run new event "Battle of the Pass"
 * npm run new person "Kael Ardent"
 * npm run new place "Greywater"
 * npm run new faction "The Iron Synod"
 *
 * Creates a ready-to-fill file in the right folder.
 */
import fs from "node:fs";
import path from "node:path";

const [kind, ...rest] = process.argv.slice(2);
const name = rest.join(" ").trim();
const folders: Record<string, string> = { event: "events", person: "people", place: "places", faction: "factions" };

if (!kind || !folders[kind] || !name) {
  console.log('Usage: npm run new <event|person|place|faction> "Name"');
  process.exit(1);
}

const slug = name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const world = fs.readFileSync(path.join("world", "world.yml"), "utf8");
const firstSlug = (section: string) => new RegExp(`^${section}:\\s*\\n(?:\\s*#.*\\n)*\\s*-\\s*(?:\\{\\s*)?slug:\\s*([a-z0-9-]+)`, "m").exec(world)?.[1] ?? "change-me";
const region = firstSlug("regions");
const category = firstSlug("categories");
const q = JSON.stringify;

const templates: Record<string, string> = {
  event: `---
title: ${q(name)}
date: "1"            # "412", "-80" (before year 1), "412-03", "412-03-14" or "~300" (about)
# end: "2"           # for events that lasted a while
region: ${region}
category: ${category}
summary: One or two sentences that sum it up. Shown on cards and in search.
places: []           # e.g. [greywater]  (file names in world/places)
people: []           # e.g. [kael-ardent] or [{ slug: kael-ardent, role: Commander }]
factions: []
# How it connects to other events (file names in world/events):
led_to: []           # this directly caused…
contributed_to: []   # this was one of the causes of…
followed_by: []      # came next, without causing it
related_to: []
---

Write what happened here. To link to a person, place, faction or event, put its name in double square brackets.
`,
  person: `---
name: ${q(name)}
title: One line about who they are
# born: "1"
# died: "60"
# region: ${region}
factions: []
aliases: []
---

Write about ${name} here.
`,
  place: `---
name: ${q(name)}
kind: City
region: ${region}
# map: [50, 50]      # position on your map: percent from the left, percent from the top
aliases: []
---

Describe ${name} here.
`,
  faction: `---
name: ${q(name)}
kind: Order
# founded: "1"
# color: "#2f5d8a"
aliases: []
---

Describe ${name} here.
`,
};

const file = path.join("world", folders[kind], `${slug}.md`);
if (fs.existsSync(file)) {
  console.log(`${file} already exists.`);
  process.exit(1);
}
fs.writeFileSync(file, templates[kind]);
console.log(`Created ${file}`);
