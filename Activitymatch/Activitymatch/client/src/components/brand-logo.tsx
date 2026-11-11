import { t } from "@/lib/i18n";
import { useId } from "react";
import logoImage from "@assets/image_1772317603904.png";

export function BrandLogo({ className = "", ...props }: {
  className?: string;
  "data-testid"?: string;
}) {
  const clipId = `brand-${useId().replace(/:/g, "")}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 417 121"
      role="img"
      aria-label={`ActivityMatch – ${t("Gemeinsam mehr erleben.")}`}
      className={className}
      {...props}
    >
      <title>{`ActivityMatch – ${t("Gemeinsam mehr erleben.")}`}</title>
      <defs>
        <clipPath id={clipId}>
          <rect width="417" height="81" />
          <rect y="81" width="153" height="40" />
        </clipPath>
      </defs>
      <image href={logoImage} width="417" height="121" clipPath={`url(#${clipId})`} />
      <text x="158" y="105" fill="#555555" fontFamily="Arial, sans-serif" fontSize="22" textLength="245" lengthAdjust="spacingAndGlyphs">
        {t("Gemeinsam mehr erleben.")}
      </text>
    </svg>
  );
}
