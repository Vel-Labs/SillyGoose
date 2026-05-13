import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silly Goose Entertainment",
  description: "Local Ledger Security Key and WebAuthn demo for verified geese."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
