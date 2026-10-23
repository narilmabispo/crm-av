import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM AV",
  description: "CRM para assistentes virtuais que atendem pelo WhatsApp",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
