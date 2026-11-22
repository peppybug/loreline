import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatRange, formatYear, parseDate, parseYearQuery, sortKey, yearLabel, type Calendar } from "../src/lib/calendar";

const cal: Calendar = { after: "AT", before: "BT", position: "suffix", months: ["Frost", "Thaw", "Seed"] };
const pre: Calendar = { ...cal, after: "TA", position: "prefix" };

test("parses every date form", () => {
  assert.deepEqual(parseDate("412", cal), { year: 412, month: null, day: null, precision: "year" });
  assert.deepEqual(parseDate("-80", cal), { year: -80, month: null, day: null, precision: "year" });
  assert.deepEqual(parseDate("412-02-14", cal), { year: 412, month: 2, day: 14, precision: "day" });
  assert.deepEqual(parseDate("~300", cal), { year: 300, month: null, day: null, precision: "approximate" });
  assert.deepEqual(parseDate(57, cal).year, 57);
});

test("rejects impossible dates with a clear reason", () => {
  assert.throws(() => parseDate("0", cal), /no year zero/);
  assert.throws(() => parseDate("12-04", cal), /3 months/);
  assert.throws(() => parseDate("Spring 12", cal), /not a date/);
  assert.throws(() => parseDate("~12-02", cal), /approximate/);
});

test("sorts across year zero without a gap", () => {
  const k = (s: string) => sortKey(parseDate(s, cal), cal);
  assert.ok(k("-1") < k("1"));
  assert.equal(k("1") - k("-1"), 1);
  assert.ok(k("5") < k("5-02") && k("5-02") < k("5-02-10") && k("5-02-10") < k("6"));
});

test("formats with the world's calendar", () => {
  assert.equal(formatYear(412, cal), "412 AT");
  assert.equal(formatYear(-80, cal), "80 BT");
  assert.equal(formatYear(3019, pre), "TA 3019");
  assert.equal(formatDate(parseDate("412-02-14", cal), cal), "14 Thaw 412 AT");
  assert.equal(formatRange(parseDate("57", cal), parseDate("71", cal), cal), "57–71 AT");
  assert.equal(formatRange(parseDate("-14", cal), parseDate("-3", cal), cal), "14–3 BT");
  assert.equal(formatRange(parseDate("-80", cal), parseDate("3", cal), cal), "80 BT – 3 AT");
  assert.equal(formatRange(parseDate("1-02-03", cal), parseDate("1-02-09", cal), cal), "3–9 Thaw 1 AT");
  assert.equal(yearLabel(parseDate("381-01-09", cal), parseDate("382-02", cal), cal), "381–382 AT");
});

test("reads years typed into search", () => {
  assert.equal(parseYearQuery("412", cal), 412);
  assert.equal(parseYearQuery("80 BT", cal), -80);
  assert.equal(parseYearQuery("bt 80", cal), -80);
  assert.equal(parseYearQuery("412at", cal), 412);
  assert.equal(parseYearQuery("TA 3019", pre), 3019);
  assert.equal(parseYearQuery("battle", cal), null);
});
