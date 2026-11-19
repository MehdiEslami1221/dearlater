import {ThemeController} from "./Appearance";
import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
export const metadata: Metadata = {
  title: "DearLater · Letters for later",
  description: "Personal Telegram messages, sealed letters and reminders.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body><ThemeController/>{children}</body>
    </html>
  );
}
