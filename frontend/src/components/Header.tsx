"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/design", label: "Create-A-Board" },
  { href: "/orders", label: "Orders" },
  { href: "/chat", label: "Maya" },
];

interface MeUser {
  email: string;
  name: string;
  role: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, toggleCart } = useCart();
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => (res.ok ? (await res.json()).user : null))
      .then((u) => setUser(u))
      .catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

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
                : pathname === href ||
                  pathname.startsWith(`${href}/`) ||
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
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden sm:flex items-center gap-2 text-xs text-ocean-700">
              <span className="max-w-[120px] truncate font-medium">{user.name.split(" ")[0]}</span>
              {user.role === "admin" && (
                <Link href="/admin" className="rounded-full bg-ocean-100 px-2 py-1 font-semibold">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-2 py-1 text-ocean-500 hover:bg-ocean-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline rounded-full px-3 py-1.5 text-sm font-medium text-ocean-700 hover:bg-ocean-50"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCart}
            className="relative rounded-full bg-ocean-600 p-2.5 text-white shadow-md hover:bg-ocean-700 transition"
            aria-label={`Cart, ${itemCount} items`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="flex sm:hidden border-t border-ocean-100 px-2 py-2 gap-1 justify-center">
        {NAV.map(({ href, label }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href ||
                pathname.startsWith(`${href}/`) ||
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
          );
        })}
      </nav>
    </header>
  );
}
