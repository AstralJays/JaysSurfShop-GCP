import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exploit Lab | Jay's Surf Shop",
  description: "Workshop PoC guide for controlled security demonstrations",
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
