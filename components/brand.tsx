import Link from "next/link";
import { Leaf } from "lucide-react";

export function Brand({ inverse = false, href = "/" }: { inverse?: boolean; href?: string }) {
  return (
    <Link href={href} className={`brand ${inverse ? "brand-inverse" : ""}`} aria-label="Washington Longevity Health Life Club home">
      <span className="brand-mark"><Leaf size={20} strokeWidth={2.4} /></span>
      <span className="brand-type">
        <strong>Washington Longevity</strong>
        <small>Health Life Club</small>
      </span>
    </Link>
  );
}
