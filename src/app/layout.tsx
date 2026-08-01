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

export const metadata: Metadata = {
  title: "HP ENTERPRISE — Safety Service & Man Power Supply",
  description:
    "HP ENTERPRISE Safety Service & Man Power Supply — a secure, cloud-based Workforce Management System with Super Admin panel and Employee self-service portal. Safety services, manpower supply, attendance, payroll, documents, clients & projects.",
  keywords: ["HP ENTERPRISE", "Safety Service", "Man Power Supply", "EHS", "Payroll", "Attendance", "Employee Portal"],
  authors: [{ name: "HP ENTERPRISE Safety Service & Man Power Supply" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        <ThemeInit />
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
