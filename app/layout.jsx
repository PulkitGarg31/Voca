import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { themeInitScript } from "@/components/ThemeProvider";
import { validateEnv } from "@/lib/env";

validateEnv();

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Voca – Vocabulary Learning Platform",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
