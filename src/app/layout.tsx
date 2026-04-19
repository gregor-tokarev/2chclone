import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import CommandPalette from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "dvач - Modern Imageboard",
  description: "A modern, fast imageboard client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="noise-overlay flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        <Footer />
        <KeyboardShortcutsHelp />
        <CommandPalette />
      </body>
    </html>
  );
}
