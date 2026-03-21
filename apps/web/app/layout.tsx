import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "LiberationOS",
  description: "Enter a goal. Get execution."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topnav">
          <Link href="/" className="logo">LiberationOS</Link>
          <Link href="/projects">Projects</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
