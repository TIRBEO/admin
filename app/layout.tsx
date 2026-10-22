import type { Metadata } from "next";
import { THEME_BOOT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Tirbeo Console", template: "%s · Tirbeo Console" },
  description: "Operations, safety and growth for Tirbeo.",
  applicationName: "Tirbeo Console",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set before paint so a dark-mode operator never gets a white flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}