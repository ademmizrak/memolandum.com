import HomeClient from "./HomeClient";
import HomeSeo from "../components/seo/HomeSeo";
import {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  KEYWORDS,
  OG_IMAGE,
  absoluteUrl,
} from "../lib/seo/siteConfig";

export const metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function HomePage() {
  return (
    <>
      <HomeClient />
      <HomeSeo />
    </>
  );
}
