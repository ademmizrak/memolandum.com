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
} from "../lib/seo/jsonLd";

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
        alt: "Memolandum — Oyna, Ezberle",
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
    "content-language": "tr",
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
          // Catch chunk load / script load errors and reload the page automatically to pull the new version
          window.addEventListener('error', function(e) {
            var target = e.target;
            if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
              var src = target.src || target.href;
              if (typeof src === 'string' && src.indexOf('_next/static') !== -1) {
                // Prevent infinite reload loops
                var lastReload = sessionStorage.getItem('last_chunk_reload');
                var now = Date.now();
                if (!lastReload || (now - parseInt(lastReload, 10) > 15000)) {
                  sessionStorage.setItem('last_chunk_reload', String(now));
                  console.warn('Resource load failed:', src, '- reloading page...');
                  window.location.reload(true);
                } else {
                  console.error('Resource load failed consistently:', src, '- reload loop blocked.');
                }
              }
            }
          }, true);

          window.addEventListener('unhandledrejection', function(e) {
            if (e.reason && (e.reason.name === 'ChunkLoadError' || /loading.*chunk/i.test(e.reason.message || ''))) {
              var lastReload = sessionStorage.getItem('last_chunk_reload');
              var now = Date.now();
              if (!lastReload || (now - parseInt(lastReload, 10) > 15000)) {
                sessionStorage.setItem('last_chunk_reload', String(now));
                console.warn('ChunkLoadError detected - reloading page...');
                window.location.reload(true);
              } else {
                console.error('ChunkLoadError consistently thrown - reload loop blocked.');
              }
            }
          });

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              var hasUnregistered = false;
              var promises = [];
              for (var i = 0; i < registrations.length; i++) {
                promises.push(registrations[i].unregister().then(function() { hasUnregistered = true; }));
              }
              Promise.all(promises).then(function() {
                if (hasUnregistered) {
                  window.location.reload(true);
                }
              });
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
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
