import type { AdvertisementInput, AdvertisementRecord } from "@/app/actions/advertisementAction";
import type { AdvertisementFormData } from "./AdvertisementForm";

/** Form values → what the API takes. */
export function toAdInput(form: AdvertisementFormData): AdvertisementInput {
  return {
    advertiser: form.advertiser.trim(),
    headline: form.headline.trim(),
    body: form.body.trim(),
    cta: form.cta.trim(),
    linkUrl: form.linkUrl.trim(),
    priceGBP: form.price.trim() ? Number(form.price) : null,
    tone: form.tone,
    imageUrl: form.imageUrl.trim(),
    placements: form.placements,
    priority: Number(form.priority) || 0,
    active: form.active,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
  };
}

/** A saved ad → form values. */
export function toAdForm(ad: AdvertisementRecord): AdvertisementFormData {
  return {
    advertiser: ad.advertiser,
    headline: ad.headline,
    body: ad.body,
    cta: ad.cta,
    linkUrl: ad.linkUrl,
    price: ad.priceGBP ? String(ad.priceGBP) : "",
    tone: ad.tone,
    imageUrl: ad.imageUrl ?? "",
    placements: ad.placements,
    priority: String(ad.priority ?? 0),
    active: ad.active,
    startDate: ad.startDate?.slice(0, 10) ?? "",
    endDate: ad.endDate?.slice(0, 10) ?? "",
  };
}
