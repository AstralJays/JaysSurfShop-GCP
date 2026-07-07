import Link from "next/link";
import Image from "next/image";

const SHOP_LINKS = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?category=surfboards", label: "Surfboards" },
  { href: "/shop?category=wax", label: "Surf Wax" },
  { href: "/shop?category=wetsuits", label: "Wetsuits" },
];

const HELP_LINKS = [
  { href: "/chat", label: "Shop Crew" },
  { href: "/design", label: "Create-A-Board" },
  { href: "/about", label: "Our Story" },
  { href: "/security", label: "Security Posture" },
];

export default function Footer() {
  return (
    <footer className="border-t border-ocean-200 bg-ocean-900 text-ocean-100 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={44} height={44} className="rounded-full" />
              <p className="font-display text-lg text-white">Jay&apos;s Surf Shop</p>
            </div>
            <p className="text-sm text-ocean-300 mt-3 leading-relaxed">
              Serving Huntington Beach surfers since 1987. Boards, wax, wetsuits, and good vibes.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Shop</h3>
            <ul className="mt-3 space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ocean-300 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Help</h3>
            <ul className="mt-3 space-y-2">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ocean-300 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Visit Us</h3>
            <address className="mt-3 text-sm text-ocean-300 not-italic leading-relaxed">
              42 Ocean Drive<br />
              Huntington Beach, CA 92648<br />
              <a href="tel:+17145557873" className="hover:text-white transition">(714) 555-SURF</a>
            </address>
            <p className="text-sm text-ocean-400 mt-3">
              Mon–Sat 9am–7pm<br />Sun 10am–5pm
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ocean-800 flex flex-col sm:flex-row justify-between gap-4 text-xs text-ocean-500">
          <p>© {new Date().getFullYear()} Jay&apos;s Surf Shop. All rights reserved.</p>
          <p>Free returns on boards within 14 days · Expert staff on every shift</p>
        </div>
      </div>
    </footer>
  );
}
