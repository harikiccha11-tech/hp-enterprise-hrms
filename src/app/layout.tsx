import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeInit } from "@/components/shared/ThemeInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_URL = "https://hpserve.site";
const HPHRMS_URL = "https://hphrms.com";

export const metadata: Metadata = {
  title: {
    default: "HP ENTERPRISE — Building Safer Tomorrow. Empowering Smarter Workplaces.",
    template: "%s | HP ENTERPRISE HPHRMS",
  },
  description:
    "HP ENTERPRISE — India's trusted workforce solutions provider. HR Management, Recruitment, Manpower Supply, EHS Consultancy, Engineering Services, Payroll Management. Powered by HPHRMS AI Platform.",
  keywords: [
    "HP ENTERPRISE", "HPHRMS", "HRMS", "Human Resource Management", "Manpower Supply",
    "Recruitment", "Talent Acquisition", "EHS Consultancy", "Safety Training",
    "Payroll Management", "Employee Management", "Attendance Management",
    "Leave Management", "AI HR Assistant", "Enterprise HR Software",
    "Bengaluru", "Karnataka", "India", "GSTIN 29ANZPH4067Q1ZS",
    "UDYAM-KR-10-0014648", "Construction Labour Supply", "Land Survey",
    "Website Design & Development", "Vendor Coordination",
  ],
  authors: [{ name: "HP ENTERPRISE", url: SITE_URL }],
  creator: "HP ENTERPRISE",
  publisher: "HP ENTERPRISE",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    websites: [SITE_URL, HPHRMS_URL],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "HP ENTERPRISE",
    title: "HP ENTERPRISE — Building Safer Tomorrow. Empowering Smarter Workplaces.",
    description: "India's trusted workforce solutions provider. HR Management, Recruitment, Manpower Supply, EHS Consultancy, Payroll Management. Powered by HPHRMS AI.",
    images: [{
      url: "/hp-logo.jpg",
      width: 1200,
      height: 630,
      alt: "HP ENTERPRISE — Building Safer Tomorrow",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HP ENTERPRISE — Building Safer Tomorrow. Empowering Smarter Workplaces.",
    description: "India's trusted workforce solutions provider. HR, Recruitment, Manpower, EHS, Payroll. Powered by HPHRMS AI.",
    images: ["/hp-logo.jpg"],
    creator: "@hpenterpri5nww",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "hpenterpriseofficial11@gmail.com",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": SITE_URL + "/#organization",
      name: "HP ENTERPRISE",
      alternateName: "HP ENTERPRISE HPHRMS",
      url: SITE_URL,
      logo: SITE_URL + "/hp-logo.jpg",
      description: "Building Safer Tomorrow. Empowering Smarter Workplaces. — India's trusted workforce solutions provider.",
      email: "hpenterpriseofficial11@gmail.com",
      telephone: "+91 80737 48271",
      taxID: "29ANZPH4067Q1ZS",
      foundingLocation: {
        "@type": "Place",
        name: "Bengaluru, Karnataka, India",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "JeevaGurunadan Building, Kalkere Market Road, Ramamurthy Nagar",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        postalCode: "560016",
        addressCountry: "IN",
      },
      sameAs: [
        "https://www.instagram.com/hpenterpriseofficial",
        "https://www.linkedin.com/in/hariprasad-np-4408a8423",
        "https://www.facebook.com/share/1DNBdqGcvb/",
        "https://x.com/hpenterpri5nww",
        "https://www.youtube.com/@HPEnterpriseIndia",
        "https://www.reddit.com/u/HPEnterpriseIndia/",
        "https://www.threads.com/@hpenterpriseofficial",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+91-80737-48271",
          contactType: "business",
          availableLanguage: ["English", "Hindi", "Kannada"],
        },
        {
          "@type": "ContactPoint",
          telephone: "+91-73377-92436",
          contactType: "HR",
          availableLanguage: ["English", "Hindi", "Kannada"],
        },
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": SITE_URL + "/#localbusiness",
      name: "HP ENTERPRISE",
      image: SITE_URL + "/hp-logo.jpg",
      telephone: "+91 80737 48271",
      email: "hpenterpriseofficial11@gmail.com",
      url: SITE_URL,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "JeevaGurunadan Building, Kalkere Market Road, Ramamurthy Nagar",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        postalCode: "560016",
        addressCountry: "IN",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
      areaServed: {
        "@type": "Country",
        name: "India",
      },
    },
    {
      "@type": "WebApplication",
      "@id": HPHRMS_URL,
      name: "HPHRMS AI",
      alternateName: "HP Enterprise HRMS",
      description: "Next-Generation AI Powered Human Resource Management Platform",
      url: HPHRMS_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "19999",
        priceCurrency: "INR",
      },
      creator: {
        "@id": SITE_URL + "/#organization",
      },
    },
    {
      "@type": "WebSite",
      "@id": SITE_URL + "/#website",
      url: SITE_URL,
      name: "HP ENTERPRISE",
      publisher: {
        "@id": SITE_URL + "/#organization",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" href="/hp-logo.jpg" />
        <meta name="theme-color" content="#002B5C" />
      </head>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        <ThemeInit />
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
