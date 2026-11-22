/**
 * npm run check
 * Reads every file in world/ and reports anything that would break the site
 * or that looks like a mistake, with the file name and a plain reason.
 */
import { loadWorld, WorldError, type Issue } from "../src/lib/world";

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function print(issues: Issue[]) {
  const byFile = new Map<string, Issue[]>();
  for (const i of issues) byFile.set(i.file, [...(byFile.get(i.file) ?? []), i]);
  for (const [file, list] of byFile) {
    console.log(`\n${file}`);
    for (const i of list) console.log(`  ${i.level === "error" ? red("error  ") : yellow("warning")} ${i.message}`);
  }
}

try {
  const w = loadWorld({ fresh: true });
  print(w.issues);
  const warnings = w.issues.length;
  console.log(
    `\n${green("✓")} ${w.config.name}: ${w.events.length} events, ${w.people.length} people, ${w.places.length} places, ${w.factions.length} factions, ${w.relations.length} connections.` +
      (warnings ? ` ${yellow(`${warnings} warning${warnings === 1 ? "" : "s"}`)} ${dim("(the site still builds)")}` : ""),
  );
} catch (e) {
  if (e instanceof WorldError) {
    print(e.issues);
    const n = e.issues.filter((i) => i.level === "error").length;
    console.log(`\n${red("✗")} ${n} problem${n === 1 ? "" : "s"} to fix before the site can build.`);
    process.exit(1);
  }
  throw e;
}
