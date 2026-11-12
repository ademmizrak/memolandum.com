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
    "word-board",
    "star-cards",
    "academic-shooter",
    "academic-lexicon",
    "orbitlex",
  ];

  const homeAlternates = {
    languages: {
      tr: absoluteUrl("/"),
      "tr-TR": absoluteUrl("/"),
      en: absoluteUrl("/en/"),
      "en-US": absoluteUrl("/en/"),
      ar: absoluteUrl("/ar/"),
      "ar-SA": absoluteUrl("/ar/"),
      "ar-IQ": absoluteUrl("/ar/"),
      "ar-EG": absoluteUrl("/ar/"),
      pt: absoluteUrl("/pt/"),
      "pt-BR": absoluteUrl("/pt/"),
      "x-default": absoluteUrl("/"),
    },
  };

  const staticRoutes = [
    { path: "/",               priority: 1.0,  changeFrequency: "daily",   alternates: homeAlternates },
    { path: "/en/",            priority: 0.99, changeFrequency: "daily",   alternates: homeAlternates },
    { path: "/ar/",            priority: 0.99, changeFrequency: "daily",   alternates: homeAlternates },
    { path: "/pt/",            priority: 0.99, changeFrequency: "daily",   alternates: homeAlternates },
    { path: "/learn/",         priority: 0.98, changeFrequency: "weekly"  },
    { path: "/schools/",       priority: 0.96, changeFrequency: "weekly"  },
    { path: "/veli-rehberi/",  priority: 0.95, changeFrequency: "weekly"  },
    { path: "/schools/rehber/",priority: 0.94, changeFrequency: "weekly"  },
    { path: "/games/",         priority: 0.96, changeFrequency: "weekly"  },
    { path: "/quiz/",          priority: 0.98, changeFrequency: "weekly"  },
    { path: "/quiz/1-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/2-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/3-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/4-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/5-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/6-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/7-sinif/",  priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/8-sinif/",  priority: 0.97, changeFrequency: "weekly" },
    { path: "/quiz/lgs-celdirici-kampi/",    priority: 0.97, changeFrequency: "weekly" },
    { path: "/quiz/lgs-olumsuz-kokler/",     priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/lgs-diyalog-bosluk/",     priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/lgs-afis-davetiye/",      priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/lgs-grafik-tablo/",       priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/lgs-es-anlam-tuzaklari/", priority: 0.96, changeFrequency: "weekly" },
    { path: "/quiz/lgs-siklik-zarflari/",    priority: 0.96, changeFrequency: "weekly" },
    { path: "/sozluk/",        priority: 0.95, changeFrequency: "weekly"  },
    { path: "/translate/",     priority: 0.95, changeFrequency: "weekly"  },
    { path: "/videos/",        priority: 0.90, changeFrequency: "weekly"  },
    { path: "/leaderboard/",   priority: 0.9,  changeFrequency: "hourly"  },
    { path: "/vocabulary/",    priority: 0.9,  changeFrequency: "weekly"  },
    { path: "/my-lexicon/",    priority: 0.85, changeFrequency: "weekly"  },
    { path: "/method/",        priority: 0.9,  changeFrequency: "monthly" },
    { path: "/roadmap/",       priority: 0.92, changeFrequency: "monthly" },
    { path: "/about/",         priority: 0.9,  changeFrequency: "weekly"  },
    { path: "/legal/",         priority: 0.55, changeFrequency: "monthly" },
    { path: "/legal/privacy/", priority: 0.6,  changeFrequency: "monthly" },
    { path: "/legal/terms/",   priority: 0.6,  changeFrequency: "monthly" },
    { path: "/delete-account/",priority: 0.5,  changeFrequency: "monthly" },
    { path: "/premium/",       priority: 0.85, changeFrequency: "weekly"  },
  ].map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...(r.alternates ? { alternates: r.alternates } : {}),
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
