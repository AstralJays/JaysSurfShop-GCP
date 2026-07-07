"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/design", label: "Create-A-Board" },
  { href: "/chat", label: "Shop Crew" },
];

export default function Header() {
  const pathname = usePathname();
  const { itemCount, toggleCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-ocean-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group">
          <Logo />
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`) ||
                  (href === "/shop" && pathname.startsWith("/products"));
            return (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-ocean-100 text-ocean-800"
                  : "text-ocean-600 hover:bg-ocean-50 hover:text-ocean-800"
              }`}
            >
              {label}
            </Link>
          );})}
        </nav>

        <button
          type="button"
          onClick={toggleCart}
          className="relative rounded-full bg-ocean-600 p-2.5 text-white shadow-md hover:bg-ocean-700 transition"
          aria-label={`Cart, ${itemCount} items`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      <nav className="flex sm:hidden border-t border-ocean-100 px-2 py-2 gap-1 justify-center">
        {NAV.map(({ href, label }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`) ||
                (href === "/shop" && pathname.startsWith("/products"));
          return (
          <Link
            key={href}
            href={href}
            className={`flex-1 text-center rounded-lg px-2 py-2 text-xs font-medium ${
              active ? "bg-ocean-100 text-ocean-800" : "text-ocean-600"
            }`}
          >
            {label}
          </Link>
        );})}
      </nav>
    </header>
  );
}
