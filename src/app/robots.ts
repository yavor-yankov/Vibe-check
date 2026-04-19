import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vibecheck.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/terms", "/privacy", "/signin"],
        disallow: ["/dashboard", "/api/", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
