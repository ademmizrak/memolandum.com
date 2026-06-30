import Home from "../../page";

// Bu sayfa /oyna/[slug] rotasına gelen istekleri karşılar ve 
// ana sayfa bileşenini (Home) ilgili slug bilgisiyle render eder.
export default function OynaSlugPage({ params }) {
  // Next.js app router'da params prop olarak gelir.
  return <Home initialSlug={params.slug} />;
}
