import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/layout/Footer";
import "./globals.css";
import NavBar from "@/components/layout/NavBar";
import {LocationProvider} from "@/context/locationContext";
import { AuthProvider } from "@/context/authContext";
import { CartProvider } from "@/context/cartContext";
import { FavoritesProvider } from "@/context/favoritesContext";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const headingText = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyText = Inter({
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${headingText.variable} ${bodyText.variable} flex flex-col min-h-screen antialiased`}
      >
        <PostHogProvider>
          <LocationProvider>
            <AuthProvider>
              <CartProvider>
                <FavoritesProvider>
                  <NavBar />
                  <main className="flex flex-col grow">{children}</main>
                  <Footer />
                </FavoritesProvider>
              </CartProvider>
            </AuthProvider>
          </LocationProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}