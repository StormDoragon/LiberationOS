import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "LiberationOS",
  description: "Enter a goal. Get execution."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
