import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/figtree";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { themeScript } from "@/components/theme-toggle";
import { accentPair, siteUrl } from "@/lib/site";
import { loadWorld } from "@/lib/world";

export function generateMetadata(): Metadata {
  const w = loadWorld();
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: { default: `${w.config.name}${w.config.tagline ? `: ${w.config.tagline}` : ""}`, template: `%s · ${w.config.name}` },
    description: w.config.description ?? w.config.tagline,
    applicationName: w.config.name,
    openGraph: { type: "website", siteName: w.config.name },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2eb" },
    { media: "(prefers-color-scheme: dark)", color: "#13120f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const w = loadWorld();
  const accent = accentPair(w.config.accent);
  const style = accent ? ({ "--accent-light": accent.light, "--accent-dark": accent.dark } as React.CSSProperties) : undefined;
  return (
    <html lang="en" suppressHydrationWarning style={style}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Skip to content
        </a>
        <SiteHeader name={w.config.name} hasMap={!!w.config.map} />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter world={w} />
      </body>
    </html>
  );
}
