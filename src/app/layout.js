import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import { LocaleProvider } from "../lib/i18n/LocaleProvider";
import {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  KEYWORDS,
  SITE_URL,
  SITE_NAME,
  OG_IMAGE,
  absoluteUrl,
} from "../lib/seo/siteConfig";
import {
  buildFaqJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildSoftwareAppJsonLd,
  buildVideoGameJsonLd,
  buildLearningListJsonLd,
  buildLearningResourceJsonLd,
} from "../lib/seo/jsonLd";
import GoogleAnalytics from "../components/GoogleAnalytics";
import VersionChecker from "../components/VersionChecker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: "Memolandum Team", url: SITE_URL }],
  creator: "Memolandum Team",
  publisher: "Memolandum",
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: absoluteUrl("/"),
    // UI yalnızca TR/EN — sahte hreflang (?lang=de vb.) Google’a zarar verir
    languages: {
      tr: absoluteUrl("/"),
      en: `${SITE_URL}/?lang=en`,
      "x-default": absoluteUrl("/"),
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    url: absoluteUrl("/"),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Memolandum — 23 Dil Yolu · KPSS Sözlük · Anlık Çeviri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "geo.region": "TR",
    "geo.placename": "Ankara, Türkiye",
    "geo.position": "39.9208;32.8541",
    ICBM: "39.9208, 32.8541",
    // Öğrenme içeriği dilleri (UI değil — içerik yolları)
    "content-language": "tr, en, de, fr, es, it, ru, pt, ko, ja, zh, ar, el",
    rating: "general",
    "revisit-after": "3 days",
    language: "tr, en",
    ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { "google-site-verification": process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : {}),
    "DC.title": DEFAULT_TITLE,
    "DC.description": DEFAULT_DESCRIPTION,
    "DC.subject":
      "vocabulary learning, 23 language pathways, KPSS glossary, instant translation, spaced repetition, kelime ezberleme, anlık çeviri",
    "DC.type": "InteractiveResource",
    "DC.format": "text/html",
    "DC.language": "tr, en",
    "DC.relation": "https://memolandum.com",
  },
};

export const viewport = {
  themeColor: "#0d0d1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLdBlocks = [
  buildOrganizationJsonLd(),
  buildWebSiteJsonLd(),
  buildSoftwareAppJsonLd(),
  buildVideoGameJsonLd(),
  buildLearningResourceJsonLd(),
  buildFaqJsonLd(),
  buildLearningListJsonLd(),
];

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning={true}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          // Auto-clear stale IndexedDB AppCheck tokens & service workers
          try {
            if ('indexedDB' in window) {
              indexedDB.deleteDatabase('firebase-app-check-database');
            }
          } catch(e) {}

          function handleChunkError() {
            var lastReload = sessionStorage.getItem('last_chunk_reload');
            var now = Date.now();
            if (!lastReload || (now - parseInt(lastReload, 10) > 10000)) {
              sessionStorage.setItem('last_chunk_reload', String(now));
              console.warn('Stale build chunk 404 detected — hard refresh to new version...');
              var url = window.location.pathname + window.location.search;
              var sep = url.indexOf('?') >= 0 ? '&' : '?';
              window.location.replace(url + sep + '_cb=' + now + window.location.hash);
            }
          }

          window.addEventListener('unhandledrejection', function(e) {
            var reason = e.reason;
            var msg = (reason && reason.message) || '';
            var isChunk = reason && (reason.name === 'ChunkLoadError' || /loading.*chunk/i.test(msg));
            if (isChunk) handleChunkError();
          });

          window.addEventListener('error', function(e) {
            var target = e.target || e.srcElement;
            if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
              var url = target.src || target.href || '';
              if (url.indexOf('_next/static') !== -1) {
                handleChunkError();
              }
            }
          }, true);

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (var i = 0; i < registrations.length; i++) {
                registrations[i].unregister();
              }
            });
          }
        `,
          }}
        />
        {jsonLdBlocks.map((block, i) => (
          <script
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        ))}

        <LocaleProvider>
          <AuthProvider>
            <GoogleAnalytics />
            <VersionChecker />
            <div className="flex-1 flex flex-col" suppressHydrationWarning={true}>
              {children}
            </div>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
