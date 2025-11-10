import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emotionale Stadt Berlin",
  description:
    "Interaktive Karte zur emotionalen und umweltbezogenen Wahrnehmung in Berlin."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="h-full w-full overflow-hidden bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
