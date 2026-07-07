import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import AddToCartToast from "@/components/AddToCartToast";
import Footer from "@/components/Footer";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const arcade = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-arcade",
});

export const metadata: Metadata = {
  title: "Jay's Surf Shop",
  description:
    "Surfboards, wax, wetsuits — plus AI-powered board design and shop assistant.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${arcade.variable}`}>
      <body className="font-sans min-h-screen bg-wave-pattern">
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <main>{children}</main>
          <CartDrawer />
          <AddToCartToast />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
