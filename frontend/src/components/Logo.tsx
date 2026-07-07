import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 44, showText = true, className = "" }: LogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo.png"
        alt="Jay's Surf Shop"
        width={size}
        height={size}
        className="rounded-full shrink-0"
        priority
      />
      {showText && (
        <span className="font-display text-xl font-bold text-ocean-900 group-hover:text-ocean-600 transition">
          Jay&apos;s Surf Shop
        </span>
      )}
    </span>
  );
}
