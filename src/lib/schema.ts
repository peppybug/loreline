import { z } from "zod";

/**
 * The shape of every file in world/. `npm run check` reports anything that
 * doesn't match, with the file name and a plain-English reason.
 */

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "use lowercase letters, numbers and dashes, like \"battle-of-greywater\"");
const dateValue = z.union([z.string(), z.number()]).transform(String);
const list = <T extends z.ZodTypeAny>(t: T) => z.array(t).default([]);
const text = z.string().trim().min(1);

export const RELATION_KINDS = ["led_to", "contributed_to", "followed_by", "part_of", "related_to"] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];

const relationTarget = z.union([slug, z.object({ to: slug, note: z.string().optional() })]).transform((v) => (typeof v === "string" ? { to: v, note: undefined } : v));

export const worldSchema = z.object({
  name: text,
  tagline: z.string().default(""),
  description: z.string().optional(),
  author: z.string().optional(),
  /** Markdown shown on the home page under the title. */
  intro: z.string().default(""),
  /** Main colour, e.g. "#8a3b2a". Used for links, causation lines and buttons. */
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "use a 6-digit hex colour like \"#8a3b2a\"").optional(),
  calendar: z
    .object({
      after: z.string().default(""),
      before: z.string().default(""),
      position: z.enum(["suffix", "prefix"]).default("suffix"),
      months: z.array(text).min(1).optional(),
    })
    .default({ after: "", before: "", position: "suffix" }),
  eras: list(
    z.object({
      slug,
      name: text,
      start: dateValue,
      end: dateValue.optional(),
      summary: z.string().default(""),
    }),
  ),
  regions: list(z.object({ slug, name: text, summary: z.string().default("") })).refine((r) => r.length > 0, "add at least one region"),
  categories: list(z.object({ slug, name: text })).refine((c) => c.length > 0, "add at least one category"),
  map: z
    .object({
      /** Path inside public/, e.g. "map.svg" or "images/map.jpg". */
      image: text,
      width: z.number().positive(),
      height: z.number().positive(),
      alt: z.string().default("Map of the world"),
    })
    .optional(),
  /** Event the Connections page opens on. Defaults to the event with the most links. */
  start_here: slug.optional(),
  footer: z.string().optional(),
  /** Show "Built with Loreline" in the footer. */
  credit: z.boolean().default(true),
});

const common = {
  aliases: list(text),
  image: z.string().optional(),
  image_alt: z.string().optional(),
  image_credit: z.string().optional(),
  featured: z.boolean().default(false),
  /** Drafts are checked but not published. */
  draft: z.boolean().default(false),
  tags: list(text),
};

export const eventSchema = z.object({
  title: text,
  date: dateValue,
  end: dateValue.optional(),
  /** Defaults to the era the date falls in. */
  era: slug.optional(),
  region: slug,
  category: slug,
  location: z.string().optional(),
  summary: text,
  places: list(slug),
  people: list(z.union([slug, z.object({ slug, role: z.string().optional() })]).transform((v) => (typeof v === "string" ? { slug: v, role: undefined } : v))),
  factions: list(slug),
  led_to: list(relationTarget),
  contributed_to: list(relationTarget),
  followed_by: list(relationTarget),
  part_of: list(relationTarget),
  related_to: list(relationTarget),
  ...common,
});

export const personSchema = z.object({
  name: text,
  /** One line: "Last queen of Vael", "Founder of the Ember Synod". */
  title: z.string().default(""),
  born: dateValue.optional(),
  died: dateValue.optional(),
  region: slug.optional(),
  factions: list(slug),
  ...common,
});

export const placeSchema = z.object({
  name: text,
  /** "City", "Fortress", "Ruin", "River"… */
  kind: z.string().default(""),
  region: slug,
  /** Position on the world map, in percent from the left and from the top: [42, 61]. */
  map: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).optional(),
  ...common,
});

export const factionSchema = z.object({
  name: text,
  /** "Kingdom", "Religious order", "Guild"… */
  kind: z.string().default(""),
  founded: dateValue.optional(),
  dissolved: dateValue.optional(),
  region: slug.optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "use a 6-digit hex colour").optional(),
  ...common,
});

export type WorldConfig = z.infer<typeof worldSchema>;
export type EventFront = z.infer<typeof eventSchema>;
export type PersonFront = z.infer<typeof personSchema>;
export type PlaceFront = z.infer<typeof placeSchema>;
export type FactionFront = z.infer<typeof factionSchema>;
