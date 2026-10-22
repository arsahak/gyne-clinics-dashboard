"use client";
import type { AdTone } from "@/app/actions/advertisementAction";
import { FaExternalLinkAlt } from "react-icons/fa";
import { AD_TONES } from "./adMeta";

/** The banner as patients see it in the webapp (same layout and colours as its AdBanner). */
export default function AdvertisementPreview({
  advertiser,
  headline,
  body,
  cta,
  priceGBP,
  tone,
  imageUrl,
  dark = false,
}: {
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  priceGBP?: number | null;
  tone: AdTone;
  imageUrl?: string;
  dark?: boolean;
}) {
  const colors = AD_TONES[tone];
  return (
    <aside
      aria-label="Advertisement preview"
      className="relative flex items-center gap-4 overflow-hidden rounded-3xl border p-4 sm:p-5"
      style={{
        background: dark
          ? `linear-gradient(90deg, ${colors.color}33, #10232e)`
          : `linear-gradient(90deg, ${colors.soft}, #ffffff)`,
        borderColor: `${colors.color}33`,
        color: dark ? "#e7f0f2" : "#12334b",
      }}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase" style={{ color: dark ? "#9bb0b8" : "#607586" }}>
          <span className="rounded border px-1.5 py-px" style={{ borderColor: dark ? "#29444e" : "#dce7e9" }}>
            Ad
          </span>
          {advertiser || "Advertiser"}
        </p>
        <p className="truncate font-semibold">{headline || "Your headline"}</p>
        <p className="mt-0.5 line-clamp-1 text-sm" style={{ color: dark ? "#9bb0b8" : "#607586" }}>
          {body || "One line about the offer."}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {priceGBP != null && priceGBP > 0 && <span className="text-sm font-semibold">£{priceGBP.toFixed(2)}</span>}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{ background: dark ? "#e7f0f2" : "#12334b", color: dark ? "#10232e" : "#ffffff" }}
        >
          {cta || "Learn more"} <FaExternalLinkAlt size={9} />
        </span>
      </div>
    </aside>
  );
}
