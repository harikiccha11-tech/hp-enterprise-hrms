import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HP Enterprise HRMS — Workforce Management",
  description:
    "HP Enterprise HRMS — a secure, cloud-based Human Resource Management System with Super Admin panel and Employee self-service portal. Onboarding, attendance, payroll, documents, clients & projects.",
  keywords: ["HP Enterprise", "HRMS", "HR Management", "Payroll", "Attendance", "Employee Portal"],
  authors: [{ name: "HP Enterprise" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
