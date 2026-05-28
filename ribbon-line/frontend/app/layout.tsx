import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RIBBON LINE",
  description: "Offline-first ERP + Wholesale dashboard foundation"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
