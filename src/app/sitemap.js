import { SITE_URL, absoluteUrl } from "../lib/seo/siteConfig";

export const dynamic = "force-static";

export default function sitemap() {
  const now = new Date();

  const games = [
    "shooter",
    "breakout",
    "highway",
    "invaders",
    "wordascent",
    "worddrop",
    "quiz",
  ];

  const staticRoutes = [
    { path: "/",            priority: 1.0,  changeFrequency: "daily"   },
    { path: "/leaderboard/",priority: 0.9,  changeFrequency: "hourly"  },
    { path: "/vocabulary/", priority: 0.85, changeFrequency: "weekly"  },
    { path: "/profile/",    priority: 0.7,  changeFrequency: "monthly" },
    { path: "/about/",      priority: 0.9,  changeFrequency: "weekly"  },
  ].map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const gameRoutes = games.map((slug) => ({
    url: absoluteUrl(`/games/${slug}/`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [
    ...staticRoutes,
    ...gameRoutes,
  ];
}
