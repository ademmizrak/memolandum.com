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
  buildPageAlternates,
} from "../lib/seo/siteConfig";
import {
  buildKnowledgeGraphJsonLd,
} from "../lib/seo/jsonLd";
import GoogleAnalytics from "../components/GoogleAnalytics";
import VersionChecker from "../components/VersionChecker";
import NotificationPrompt from "../components/learning/NotificationPrompt";
import CapacitorAppManager from "../components/CapacitorAppManager";

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
  alternates: buildPageAlternates("/"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    alternateLocale: ["en_US", "ar_SA", "pt_BR"],
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
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
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
    language: "tr, en, ar, pt, pt-BR",
    ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { "google-site-verification": process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : {}),
    "DC.title": DEFAULT_TITLE,
    "DC.description": DEFAULT_DESCRIPTION,
    "DC.subject":
      "vocabulary learning, 23 language pathways, KPSS glossary, instant translation, spaced repetition, kelime ezberleme, anlık çeviri, تعلم المفردات بالألعاب, aprender vocabulário jogos, aprender inglês jogando grátis, vocabulário inglês ENEM",
    "DC.type": "InteractiveResource",
    "DC.format": "text/html",
    "DC.language": "tr, en, ar, pt, pt-BR",
    "DC.relation": "https://memolandum.com",
  },
};

export const viewport = {
  themeColor: "#0d0d1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Tekil @graph Knowledge Graph — alt şemalar (@id: #organization, #website, #app, #game, #course, #itemlist)
// zaten buildKnowledgeGraphJsonLd() içinde yer aldığı için tekrar eklenmez (GSC "Yorumun birden fazla toplam puanı var" / duplicate aggregateRating hatasını önler).
const jsonLdBlocks = [
  buildKnowledgeGraphJsonLd(),
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
          (function() {
            try {
              var supported = { tr: 1, en: 1, ar: 1, pt: 1 };
              var loc = null;
              var pathSeg = (window.location.pathname.split('/')[1] || '').toLowerCase();
              var pathSecond = (window.location.pathname.split('/')[2] || '').toLowerCase();
              if (pathSeg === 'ar' || pathSeg === 'pt' || pathSeg === 'en') loc = pathSeg;
              else if (pathSeg === 'learn' && pathSecond.indexOf('ar-') === 0) loc = 'ar';
              else if (pathSeg === 'learn' && pathSecond.indexOf('pt-') === 0) loc = 'pt';
              var q = new URLSearchParams(window.location.search).get('lang');
              if (q && supported[q]) loc = q;
              var isBot = /bot|googlebot|google-inspectiontool|googleother|crawler|spider|robot|crawling|bingbot|slurp|duckduckbot|baiduspider|yandexbot|gptbot|oai-searchbot|claudebot|anthropic|perplexity|applebot|lighthouse/i.test(navigator.userAgent || '');
              if (!loc && isBot) {
                loc = 'tr';
              }
              if (!loc) {
                var stored = localStorage.getItem('memolandum-ui-locale');
                if (stored && supported[stored]) loc = stored;
              }
              if (!loc) {
                var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
                for (var i = 0; i < list.length; i++) {
                  var c = String(list[i] || '').toLowerCase().slice(0, 2);
                  if (c === 'tr' || c === 'ar' || c === 'pt') { loc = c; break; }
                }
                if (!loc) {
                  var tz = (Intl && Intl.DateTimeFormat) ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '') : '';
                  if (tz === 'Europe/Istanbul' || tz.indexOf('Asia/Istanbul') === 0 || tz === 'Asia/Ankara') loc = 'tr';
                  else if (/^Asia\\/(Baghdad|Riyadh|Kuwait|Dubai|Qatar|Bahrain|Muscat|Amman|Damascus|Beirut|Gaza|Hebron|Aden)$|^Africa\\/(Cairo|Tripoli|Tunis|Algiers|Casablanca|Khartoum)$/.test(tz)) loc = 'ar';
                  else if (/^America\\/(Sao_Paulo|Fortaleza|Recife|Bahia|Belem|Manaus|Cuiaba|Porto_Velho|Boa_Vista|Rio_Branco|Maceio|Campo_Grande|Araguaina|Noronha)$|^Europe\\/Lisbon$/.test(tz)) loc = 'pt';
                  else loc = 'en';
                }
                if (!isBot) {
                  localStorage.setItem('memolandum-ui-locale', loc);
                }
              }
              document.documentElement.lang = loc;
              document.documentElement.dir = (loc === 'ar') ? 'rtl' : 'ltr';
              if ((loc === 'ar' || window.location.pathname.indexOf('ar') !== -1 || window.location.search.indexOf('ar') !== -1) && !document.getElementById('mm-arabic-font')) {
                var l = document.createElement('link');
                l.id = 'mm-arabic-font';
                l.rel = 'stylesheet';
                l.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@500;700;800&display=swap';
                document.head.appendChild(l);
              }
            } catch (e) {}
          })();

          (function() {
            try {
              if (!String.prototype.replaceAll) {
                String.prototype.replaceAll = function(str, newStr) {
                  if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
                    return this.replace(str, newStr);
                  }
                  return this.split(str).join(newStr);
                };
              }
              if (!Array.prototype.at) {
                Array.prototype.at = function(n) {
                  n = Math.trunc(n) || 0;
                  if (n < 0) n += this.length;
                  if (n < 0 || n >= this.length) return undefined;
                  return this[n];
                };
              }
              if (!String.prototype.at) {
                String.prototype.at = function(n) {
                  n = Math.trunc(n) || 0;
                  if (n < 0) n += this.length;
                  if (n < 0 || n >= this.length) return undefined;
                  return this.charAt(n);
                };
              }
              if (!Object.hasOwn) {
                Object.hasOwn = function(obj, prop) {
                  return Object.prototype.hasOwnProperty.call(obj, prop);
                };
              }
              if (!window.requestIdleCallback) {
                window.requestIdleCallback = function(cb) {
                  var start = Date.now();
                  return setTimeout(function() {
                    cb({ didTimeout: false, timeRemaining: function() { return Math.max(0, 50 - (Date.now() - start)); } });
                  }, 1);
                };
                window.cancelIdleCallback = function(id) { clearTimeout(id); };
              }
              if (typeof window.ResizeObserver === 'undefined') {
                window.ResizeObserver = function() {
                  this.observe = function() {};
                  this.unobserve = function() {};
                  this.disconnect = function() {};
                };
              }
              if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
                CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
                  var r = typeof radii === 'number' ? radii : (Array.isArray(radii) && radii.length ? Number(radii[0]) || 0 : 0);
                  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
                  this.moveTo(x + r, y);
                  this.arcTo(x + w, y, x + w, y + h, r);
                  this.arcTo(x + w, y + h, x, y + h, r);
                  this.arcTo(x, y + h, x, y, r);
                  this.arcTo(x, y, x + w, y, r);
                  this.closePath();
                  return this;
                };
              }
            } catch (e) {}
          })();

          var _mmErrCount = 0;
          function reportLegacyRuntimeError(msg, src, line, type) {
            try {
              if (_mmErrCount >= 3 || !msg) return;
              _mmErrCount++;
              if (typeof window._memoGtag === 'function') {
                window._memoGtag('event', 'client_runtime_error', {
                  error_type: String(type || 'error').slice(0, 40),
                  error_message: String(msg).slice(0, 140),
                  error_source: String(src || '').slice(-80),
                  error_line: String(line || 0),
                  is_legacy_android: /Android\\s+[4-9]|Chrome\\/[4-8][0-9]\\./i.test(navigator.userAgent || ''),
                  transport_type: 'beacon'
                });
              }
            } catch (e) {}
          }

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
            var msg = (reason && reason.message) || String(reason || '');
            var isChunk = reason && (reason.name === 'ChunkLoadError' || /loading.*chunk/i.test(msg));
            if (isChunk) handleChunkError();
            else reportLegacyRuntimeError(msg, window.location.pathname, 0, 'unhandledrejection');
          });

          window.addEventListener('error', function(e) {
            var target = e.target || e.srcElement;
            if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
              var url = target.src || target.href || '';
              if (url.indexOf('_next/static') !== -1) {
                handleChunkError();
              }
            } else if (e && e.message) {
              reportLegacyRuntimeError(e.message, e.filename || window.location.pathname, e.lineno || 0, 'window_error');
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

        <noscript>
          <section lang="en" style={{ padding: "1.5rem", maxWidth: "64rem", margin: "0 auto", color: "#e2e8f0", background: "#0f172a" }}>
            <h1>Memolandum — Free Gamified Vocabulary &amp; Ebbinghaus Spaced Repetition Platform (23 Language Pathways)</h1>
            <p>
              Memolandum (https://memolandum.com/) is a 100% free and ad-free global EdTech platform combining 10+ HTML5 arcade vocabulary games (Retro Shooter, OrbitLex, Star Trio Cards, Wooden Word Board, Word Card, Breakout, Highway Survivor, Siberian Invaders, Word Ascent, Word Drop, Retro Hangman, Word Snake) with Ebbinghaus Spaced Repetition (Memolandum Pulse / SM-2), Grades 1–12 &amp; LGS/YKS/YDS/IELTS/TOEFL/ENEM English curriculum, Teacher Classroom Desk (/schools/), Parent Achievement Report Cards (/veli-rehberi/), KPSS Academic Glossary (~4,000 concepts at /sozluk/), and Gemini AI Instant Translation in 14 languages (/translate/).
            </p>
            <p lang="tr">
              <strong>Türkçe:</strong> Memolandum, 1–12. sınıf MEB İngilizce müfredatı, LGS/YKS/YDS sınav kelimeleri, 23 dil yolu (/learn/), 10+ ücretsiz arcade kelime oyunu (Retro Shooter, OrbitLex vb.), Öğretmen Sınıf Masası (/schools/), Veli Başarı Karnesi (/veli-rehberi/), KPSS Akademik Sözlük (/sozluk/) ve 14 dilde Gemini AI Anlık Çeviri sunan ücretsiz ve reklamsız eğitim platformudur.
            </p>
            <p lang="ar" dir="rtl">
              <strong>العربية:</strong> منصة Memolandum (https://memolandum.com/ar/) هي منصة مجانية 100% وخالية من الإعلانات لتعلّم اللغات وحفظ المفردات عبر أكثر من 10 ألعاب أركيد تفاعلية (Retro Shooter, OrbitLex) ونظام التكرار المتباعد العلمي (Ebbinghaus SM-2) في 23 مساراً لغوياً، ومنهج اللغة الإنجليزية للصفوف 1–12، ومكتب المعلم (/schools/)، وترجمة Gemini الفورية.
            </p>
            <p lang="pt-BR">
              <strong>Português (Brasil):</strong> O Memolandum (https://memolandum.com/pt/) é uma plataforma 100% gratuita e sem anúncios para memorizar vocabulário em inglês (1º ao 12º ano e ENEM) e 23 trilhas de idiomas com mais de 10 jogos arcade, repetição espaçada (SM-2) e Tradução Instantânea IA.
            </p>
            <ul>
              <li><a href="https://memolandum.com/">Home (TR / Global)</a> · <a href="https://memolandum.com/ar/">العربية (AR)</a> · <a href="https://memolandum.com/pt/">Português (PT-BR)</a> · <a href="https://memolandum.com/en/">English (EN)</a></li>
              <li><a href="https://memolandum.com/games/">All Arcade Games</a> · <a href="https://memolandum.com/games/shooter/">Retro Shooter</a> · <a href="https://memolandum.com/games/orbitlex/">OrbitLex</a> · <a href="https://memolandum.com/games/word-card/">Word Card</a></li>
              <li><a href="https://memolandum.com/learn/">23 Language Pathways</a> · <a href="https://memolandum.com/schools/">Memolandum for Schools</a> · <a href="https://memolandum.com/veli-rehberi/">Parent Guide &amp; Report Card</a></li>
              <li><a href="https://memolandum.com/sozluk/">KPSS &amp; Academic Glossary</a> · <a href="https://memolandum.com/translate/">Gemini AI Instant Translation</a> · <a href="https://www.youtube.com/@memolandum">Official YouTube (@memolandum)</a></li>
            </ul>
          </section>
        </noscript>

        <LocaleProvider>
          <AuthProvider>
            <CapacitorAppManager />
            <GoogleAnalytics />
            <VersionChecker />
            <div className="flex-1 flex flex-col" suppressHydrationWarning={true}>
              {children}
            </div>
            <NotificationPrompt />
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
