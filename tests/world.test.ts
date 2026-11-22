import assert from "node:assert/strict";
import { test } from "node:test";
import { longestChain, loadWorld, relationsOf } from "../src/lib/world";

test("the demo world loads cleanly", () => {
  const w = loadWorld({ fresh: true });
  assert.equal(w.issues.filter((i) => i.level === "error").length, 0);
  assert.equal(w.issues.length, 0, w.issues.map((i) => `${i.file}: ${i.message}`).join("\n"));
  assert.ok(w.events.length >= 15);
});

test("reverse links are worked out", () => {
  const w = loadWorld({ fresh: true });
  const rel = relationsOf(w, "night-of-the-tide");
  assert.deepEqual(rel.causedBy.map((r) => r.event.slug), ["edict-of-the-open-gates"]);
  assert.deepEqual(rel.ledTo.map((r) => r.event.slug), ["flight-to-the-isles"]);
  assert.ok(w.person.get("queen-isembard")!.events.includes("night-of-the-tide"));
  assert.ok(w.faction.get("hollow-court")!.members.includes("lysa-marrow"));
});

test("events get their era from their date", () => {
  const w = loadWorld({ fresh: true });
  assert.equal(w.event.get("salt-famine")!.era, "age-of-crowns");
  assert.equal(w.event.get("night-of-the-tide")!.era, "the-drowning");
  assert.equal(w.event.get("crowning-at-merrow")!.era, "ember-years");
});

test("wiki links become links", () => {
  const w = loadWorld({ fresh: true });
  assert.match(w.event.get("night-of-the-tide")!.html, /<a class="wikilink" href="\/person\/queen-isembard\/">Queen Isembard<\/a>/);
});

test("finds the longest chain of causes", () => {
  const w = loadWorld({ fresh: true });
  assert.ok(longestChain(w).length >= 5);
});
