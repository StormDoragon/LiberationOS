import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "LiberationOS",
  description: "AI that turns business goals into review-ready content pipelines. No magic, just reliable agents + you."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topnav">
          <Link href="/" className="logo">LiberationOS</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/attention">Attention</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
