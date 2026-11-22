import type { NextConfig } from "next";

/**
 * Loreline always builds a fully static site into ./out, which any static
 * host can serve (GitHub Pages, Netlify, Cloudflare Pages, itch.io, a USB stick).
 *
 * BASE_PATH: set it when the site lives in a sub-folder, e.g. "/my-world" for
 * https://you.github.io/my-world/. The GitHub Pages workflow sets it for you.
 */
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  poweredByHeader: false,
};

export default nextConfig;
