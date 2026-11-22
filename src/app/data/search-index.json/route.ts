import { buildSearchIndex } from "@/lib/search-index";
import { loadWorld } from "@/lib/world";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex(loadWorld()));
}
