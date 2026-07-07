import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Posture & Monitoring Demo | Jay's Surf Shop",
  description: "Workshop PoC guide for controlled security demonstrations",
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
