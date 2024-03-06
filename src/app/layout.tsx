import { cn } from "@/lib/utils";
import "../styles/globals.css";

import type { Metadata } from "next";
import font from "next/font/local";

const primary = font({
  src: "../fonts/roobert-variable.woff2",
});

export const metadata: Metadata = {
  title: "Foxlink",
  description: "woa cool url shortner :3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className={primary.className}>
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
