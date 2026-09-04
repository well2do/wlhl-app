import Link from "next/link";
import { Leaf } from "lucide-react";

export function Brand({
  inverse = false,
  href = "/",
  name = "CAUCC",
  tagline = "Chinese American United Chamber of Commerce",
  logoSrc,
  logoAlt = "",
}: {
  inverse?: boolean;
  href?: string;
  name?: string;
  tagline?: string;
  logoSrc?: string;
  logoAlt?: string;
}) {
  return (
    <Link href={href} className={`brand ${inverse ? "brand-inverse" : ""}`} aria-label={`${name} — ${tagline} home`}>
      <span className={`brand-mark ${logoSrc ? "brand-mark-uploaded" : ""}`}>
        {logoSrc ? <img src={logoSrc} alt={logoAlt} /> : <Leaf size={20} strokeWidth={2.4} />}
      </span>
      <span className="brand-type">
        <strong>{name}</strong>
        <small>{tagline}</small>
      </span>
    </Link>
  );
}
