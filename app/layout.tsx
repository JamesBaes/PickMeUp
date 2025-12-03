import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";
import NavBar from "@/components/NavBar";

const headingText = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyText = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PickMeUp Gladiator",
  description: "Order gourmet hand-crafted juicy beef and chicken burgers, delicious steak sandwiches, never frozen, prepared daily in-house with delicious sides and milkshakes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingText.variable} ${bodyText.variable} flex flex-col min-h-screen antialiased`}
      >
        <NavBar />
        <main className="flex flex-col grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
