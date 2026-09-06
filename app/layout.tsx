import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "notera — Notlarından test oluştur",
  description: "Türkçe ders notlarından saniyeler içinde test oluştur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
