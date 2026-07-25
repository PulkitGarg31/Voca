import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { themeInitScript } from "@/components/ThemeProvider";
import { validateEnv } from "@/lib/env";

validateEnv();

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Fraunces — a literary "old-style" serif — drives all display type. Italic is
// loaded for accent words (e.g. the "Voca" wordmark).
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata = {
  title: "VOCA | Vocabulary Learning Platform",
  description:
    "Store, organize, and practice English words with AI-powered insights",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme class before paint to avoid a flash of the wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${display.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
