import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = 'https://www.luxique.nl'

export type PageKey =
  | 'home'
  | 'about'
  | 'contact'
  | 'behandelingen'
  | 'courses'
  | 'faq'
  | 'persoonlijk-traject'
  | 'pricing'
  | 'login'
  | 'register'
  | 'voorwaarden'

type PageCopy = Record<PageKey, { title: string; description: string }>

const nl: PageCopy = {
  home: {
    title: 'LXQ Academy — The Art of Lashes, Perfected',
    description: "Behandelingen in Arnhem en opleidingen voor de nieuwe lichting lash artists — door Nederland's #1 lash educator.",
  },
  about: {
    title: 'Over Luxique & Chiva — Lash Artist en Educator',
    description: 'Maak kennis met Chiva, de visie achter Luxique en haar aanpak voor hoogwaardige lashbehandelingen en professionele opleidingen.',
  },
  contact: {
    title: 'Contact — Luxique Arnhem',
    description: 'Neem contact op met Luxique voor vragen over lashbehandelingen, online cursussen en persoonlijke opleidingstrajecten in Arnhem.',
  },
  behandelingen: {
    title: 'Lashbehandelingen in Arnhem — Luxique',
    description: 'Ontdek premium lash extensions in Arnhem, volledig afgestemd op jouw oogvorm, natuurlijke wimpers en gewenste uitstraling.',
  },
  courses: {
    title: 'Online Lash Cursussen — LXQ Academy',
    description: 'Bekijk de online lash cursussen van LXQ Academy en leer professionele technieken stap voor stap, op je eigen tempo.',
  },
  faq: {
    title: 'Veelgestelde Vragen — Luxique',
    description: 'Vind antwoorden over Luxique behandelingen, afspraken, online cursussen, persoonlijke trajecten, betalingen en annuleringen.',
  },
  'persoonlijk-traject': {
    title: 'Persoonlijk Lash Traject — LXQ Academy',
    description: 'Ontwikkel je lashvaardigheden met een persoonlijk opleidingstraject, praktijkbegeleiding en advies afgestemd op jouw niveau.',
  },
  pricing: {
    title: 'Prijzen — Luxique Behandelingen en Academy',
    description: 'Bekijk de actuele prijzen voor Luxique lashbehandelingen, online cursussen en persoonlijke opleidingstrajecten.',
  },
  login: {
    title: 'Inloggen — Luxique',
    description: 'Log in op je Luxique-account om je cursussen, lessen, profiel en afspraken te bekijken.',
  },
  register: {
    title: 'Account Aanmaken — Luxique',
    description: 'Maak een Luxique-account aan voor toegang tot je cursussen, lessen, profiel en boekingen.',
  },
  voorwaarden: {
    title: 'Voorwaarden, Privacy en Annulering — Luxique',
    description: 'Lees de algemene voorwaarden, privacyverklaring, cookieverklaring en het annuleringsbeleid van Luxique.',
  },
}

const en: PageCopy = {
  home: {
    title: 'LXQ Academy — The Art of Lashes, Perfected',
    description: "Lash treatments in Arnhem and education for the next generation of lash artists — by the Netherlands' #1 lash educator.",
  },
  about: {
    title: 'About Luxique & Chiva — Lash Artist and Educator',
    description: 'Meet Chiva, discover the vision behind Luxique and learn about her approach to premium lash treatments and professional education.',
  },
  contact: {
    title: 'Contact — Luxique Arnhem',
    description: 'Contact Luxique with questions about lash treatments, online courses and personal training programmes in Arnhem.',
  },
  behandelingen: {
    title: 'Lash Treatments in Arnhem — Luxique',
    description: 'Discover premium lash extensions in Arnhem, tailored to your eye shape, natural lashes and preferred look.',
  },
  courses: {
    title: 'Online Lash Courses — LXQ Academy',
    description: 'Explore LXQ Academy online lash courses and learn professional techniques step by step, at your own pace.',
  },
  faq: {
    title: 'Frequently Asked Questions — Luxique',
    description: 'Find answers about Luxique treatments, appointments, online courses, personal programmes, payments and cancellations.',
  },
  'persoonlijk-traject': {
    title: 'Personal Lash Training — LXQ Academy',
    description: 'Develop your lash skills through personal training, hands-on guidance and advice tailored to your experience level.',
  },
  pricing: {
    title: 'Pricing — Luxique Treatments and Academy',
    description: 'View current pricing for Luxique lash treatments, online courses and personal training programmes.',
  },
  login: {
    title: 'Log In — Luxique',
    description: 'Log in to your Luxique account to access your courses, lessons, profile and appointments.',
  },
  register: {
    title: 'Create an Account — Luxique',
    description: 'Create a Luxique account to access your courses, lessons, profile and bookings.',
  },
  voorwaarden: {
    title: 'Terms, Privacy and Cancellation — Luxique',
    description: 'Read the Luxique terms and conditions, privacy policy, cookie policy and cancellation policy.',
  },
}

const paths: Record<PageKey, string> = {
  home: '',
  about: '/about',
  contact: '/contact',
  behandelingen: '/behandelingen',
  courses: '/courses',
  faq: '/faq',
  'persoonlijk-traject': '/persoonlijk-traject',
  pricing: '/pricing',
  login: '/login',
  register: '/register',
  voorwaarden: '/voorwaarden',
}

export function buildLocalizedPageMetadata(locale: string, page: PageKey): Metadata {
  const copy = locale === 'nl' ? nl[page] : en[page]
  const path = paths[page]
  const canonical = `${BASE_URL}/${locale}${path}`
  const languages = Object.fromEntries(
    routing.locales.map((language) => [language, `${BASE_URL}/${language}${path}`]),
  )

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        ...languages,
        'x-default': `${BASE_URL}/${routing.defaultLocale}${path}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: 'website',
      url: canonical,
      images: [
        {
          url: `${BASE_URL}/images/hero-bg.jpg`,
          alt: copy.title,
        },
      ],
    },
  }
}
