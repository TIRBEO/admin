import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TirbeoThemeProvider } from "@tirbeo/theme";
import { ErrorBoundary } from "../components/error-boundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tirbeo Admin OS",
  description: "Tirbeo Administration Console",
};

// Theme script that reads from localStorage and applies the correct theme
// This runs before React to prevent flash of unstyled content (FOUC)
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('tirbeo-theme-mode') || 'dark';
      var root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body suppressHydrationWarning className="font-sans antialiased">
        <TirbeoThemeProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </TirbeoThemeProvider>
      </body>
    </html>
  );
}
