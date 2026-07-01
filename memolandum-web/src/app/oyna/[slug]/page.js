import Home from "../../page";
import { redirect } from "next/navigation";

// Bu sayfa /oyna/[slug] rotasına gelen istekleri karşılar ve 
// ana sayfa bileşenini (Home) ilgili slug bilgisiyle render eder.

export function generateStaticParams() {
  return [
    { slug: 'shooter' },
    { slug: 'breakout' },
    { slug: 'highway' },
    { slug: 'invaders' },
    { slug: 'wordascent' },
    { slug: 'worddrop' }
  ];
}

export default function OynaSlugPage({ params }) {
  const validSlugs = ['shooter', 'breakout', 'highway', 'invaders', 'wordascent', 'worddrop'];
  
  if (!validSlugs.includes(params.slug)) {
    // Eski versiyondan kalan veya geçersiz bir slug ise ana sayfaya zorla yönlendir
    redirect('/');
  }

  // Next.js app router'da params prop olarak gelir.
  return <Home initialSlug={params.slug} />;
}
