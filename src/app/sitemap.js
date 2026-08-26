import { absoluteUrl } from "../lib/seo/siteConfig";
import { loadGlossaryData, getAllCategories } from "../lib/glossary";
import { getAllPathways } from "../lib/seo/learnPathways";
import { getAllLearnLevels } from "../lib/seo/learnLevels";

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
    "lexicon",
    "quiz",
    "hangman",
    "word-snake",
    "word-card",
    "academic-shooter",
    "academic-lexicon",
  ];

  const staticRoutes = [
    { path: "/",               priority: 1.0,  changeFrequency: "daily"   },
    { path: "/learn/",         priority: 0.98, changeFrequency: "weekly"  },
    { path: "/games/",         priority: 0.96, changeFrequency: "weekly"  },
    { path: "/sozluk/",        priority: 0.95, changeFrequency: "weekly"  },
    { path: "/translate/",     priority: 0.95, changeFrequency: "weekly"  },
    { path: "/leaderboard/",   priority: 0.9,  changeFrequency: "hourly"  },
    { path: "/vocabulary/",    priority: 0.9,  changeFrequency: "weekly"  },
    { path: "/my-lexicon/",    priority: 0.85, changeFrequency: "weekly"  },
    { path: "/method/",        priority: 0.9,  changeFrequency: "monthly" },
    { path: "/roadmap/",       priority: 0.92, changeFrequency: "monthly" },
    { path: "/about/",         priority: 0.9,  changeFrequency: "weekly"  },
    { path: "/legal/",         priority: 0.55, changeFrequency: "monthly" },
    { path: "/legal/privacy/", priority: 0.6,  changeFrequency: "monthly" },
    { path: "/legal/terms/",   priority: 0.6,  changeFrequency: "monthly" },
    { path: "/premium/",       priority: 0.85, changeFrequency: "weekly"  },
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
    priority: slug.startsWith("academic") ? 0.88 : 0.85,
  }));

  const learnRoutes = getAllPathways().map((p) => ({
    url: absoluteUrl(`/learn/${p.slug}/`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.92,
  }));

  const learnLevelRoutes = getAllLearnLevels().list.map((e) => ({
    url: absoluteUrl(e.pageHref),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.72,
  }));

  const categories = getAllCategories();
  const categoryRoutes = categories.map((cat) => ({
    url: absoluteUrl(`/sozluk/${cat.slug}/`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const concepts = loadGlossaryData();
  const conceptRoutes = concepts.map((c) => ({
    url: absoluteUrl(`/sozluk/${c.category}/${c.slug}/`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...learnRoutes,
    ...learnLevelRoutes,
    ...gameRoutes,
    ...categoryRoutes,
    ...conceptRoutes,
  ];
}
