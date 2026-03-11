import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Notions",
  description: "Simple note-taking app with AI autocomplete",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geist.variable} antialiased`}
        style={{ fontFamily: "var(--font-geist), system-ui, sans-serif" }}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
