import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Memolandum | Oyna, Ezberle - Kelime Öğrenme Oyunu",
  description: "Siber uzay arcade temasıyla eğlenirken İngilizce kelime ezberleyin! Memolandum, retro oynanış eşliğinde A1-B2 seviyelerinde kelime dağarcığınızı hızla geliştirir.",
  keywords: "ingilizce kelime ezberleme, kelime ezberleme oyunu, ingilizce öğrenme, siber arcade, space shooter kelime oyunu, memolandum, ingilizce pratik cümleler, a1 ingilizce kelimeler, rusça türkçe kelime ezberleme, ruslar için türkçe öğrenme, korece türkçe kelime öğrenme, yunanca kelime ezberleme",
  authors: [{ name: "Memolandum Team" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://memolandum.com",
    languages: {
      "tr": "https://memolandum.com/",
      "pt": "https://memolandum.com/pt-en",
      "en": "https://memolandum.com/en-pt",
      "ko": "https://memolandum.com/ko-tr",
      "ru": "https://memolandum.com/ru-tr",
      "x-default": "https://memolandum.com/",
    },
  },
  openGraph: {
    type: "website",
    url: "https://memolandum.com",
    title: "Memolandum - Siber İngilizce Kelime Ezberleme Oyunu",
    description: "Siber uzay arcade temasıyla eğlenirken İngilizce kelime ezberleyin! A1-B2 seviyeleri ve siber kelime protokolü ile kelime bilginizi saniyeler içinde kalıcı hale getirin.",
    siteName: "Memolandum",
    images: [{
      url: "https://memolandum.com/memolandum_preview.png",
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://memolandum.com",
    title: "Memolandum - Siber İngilizce Kelime Ezberleme Oyunu",
    description: "Siber uzay arcade temasıyla eğlenirken İngilizce kelime ezberleyin! A1-B2 seviyeleri ve siber kelime protokolü ile kelime bilginizi saniyeler içinde kalıcı hale getirin.",
    images: ["https://memolandum.com/memolandum_preview.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  themeColor: "#0d0d1a",
};

const jsonLdVideoGame = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Memolandum",
  "genre": "Educational Game",
  "playMode": "SinglePlayer",
  "applicationCategory": "Game, Educational",
  "operatingSystem": "Web, iOS, Android",
  "description": "Siber uzay arcade temasıyla eğlenirken İngilizce kelime ezberleyin! Memolandum, retro oynanış eşliğinde A1-B2 seviyelerinde İngilizce kelimeleri ve pratik cümleleri kalıcı hale getiren eğitici bir web oyunudur.",
  "url": "https://memolandum.com",
  "author": {
    "@type": "Organization",
    "name": "Memolandum Team"
  },
  "image": "https://memolandum.com/memolandum_preview.png",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  }
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Memolandum",
  "alternateName": "Memolandum İngilizce Kelime Oyunu",
  "url": "https://memolandum.com",
  "potentialAction": {
    "@type": "PlayAction",
    "target": "https://memolandum.com",
    "name": "Memolandum Kelime Oyununu Başlat"
  }
};

const jsonLdSoftwareApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Memolandum",
  "operatingSystem": "All",
  "applicationCategory": "EducationalApplication",
  "description": "Arcade tarzı oyunlarla İngilizce kelime ezberleme platformu.",
  "browserRequirements": "Requires HTML5 Canvas and JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD"
  },
  "potentialAction": {
    "@type": "PlayAction",
    "target": "https://memolandum.com",
    "name": "Kelime Ezberleme Oyununu Başlat"
  }
};

const jsonLdLearningResource = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Memolandum İngilizce Seviye Listeleri",
  "description": "Oyun oynayarak ezberleyebileceğiniz İngilizce kelime grupları ve pratik cümleler.",
  "itemListElement": [
    {
      "@type": "LearningResource",
      "position": 1,
      "name": "A1 İngilizce Kelime Listesi",
      "description": "Temel başlangıç seviyesi İngilizce kelimeler ve anlamları.",
      "learningResourceType": "Vocabulary List",
      "audience": { "@type": "EducationalAudience", "educationalRole": "Student" }
    },
    {
      "@type": "LearningResource",
      "position": 2,
      "name": "A2 İngilizce Kelime Listesi",
      "description": "Günlük konuşmada en çok kullanılan temel kelimeler.",
      "learningResourceType": "Vocabulary List",
      "audience": { "@type": "EducationalAudience", "educationalRole": "Student" }
    },
    {
      "@type": "LearningResource",
      "position": 3,
      "name": "B1 İngilizce Kelime Listesi",
      "description": "Orta düzey kelime dağarcığı ve siber kelime protokolü.",
      "learningResourceType": "Vocabulary List",
      "audience": { "@type": "EducationalAudience", "educationalRole": "Student" }
    },
    {
      "@type": "LearningResource",
      "position": 4,
      "name": "B2 İngilizce Kelime Listesi",
      "description": "İleri düzey akademik ve iş İngilizcesi kelimeleri.",
      "learningResourceType": "Vocabulary List",
      "audience": { "@type": "EducationalAudience", "educationalRole": "Student" }
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              let hasUnregistered = false;
              const promises = [];
              for (let registration of registrations) {
                promises.push(registration.unregister().then(() => { hasUnregistered = true; }));
              }
              Promise.all(promises).then(() => {
                if (hasUnregistered) {
                  window.location.reload(true);
                }
              });
            });
          }
        `}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVideoGame) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLearningResource) }} />
        
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
