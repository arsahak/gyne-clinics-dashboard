"use client";
import { type AdvertisementRecord, deleteAdvertisement, updateAdvertisement } from "@/app/actions/advertisementAction";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaBullhorn, FaChartLine, FaEdit, FaExternalLinkAlt, FaMapMarkerAlt, FaMousePointer, FaPercent, FaTrashAlt } from "react-icons/fa";
import { AD_SLOTS, AD_TONES, adStatus, ctr, formatDay, scheduleLabel, STATUS_META } from "./adMeta";
import AdvertisementPreview from "./AdvertisementPreview";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

const AdvertisementDetails = ({ ad }: { ad: AdvertisementRecord }) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const state = adStatus(ad);
  const status = STATUS_META[state];
  const tone = AD_TONES[ad.tone] ?? AD_TONES.primary;
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const card = `rounded-xl border p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const tile = `rounded-xl border p-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const outlineBtn = `px-4 py-2.5 rounded-lg border text-sm ${
    isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

  const handleActive = async () => {
    setBusy(true);
    const response = await updateAdvertisement(ad._id, { active: !ad.active });
    setBusy(false);
    if (response.success) {
      toast.success(ad.active ? "Ad paused" : "Ad switched on");
      router.refresh();
    } else toast.error(response.error || "Failed to update the ad");
  };

  const handleDelete = async () => {
    setBusy(true);
    const response = await deleteAdvertisement(ad._id);
    if (response.success) {
      toast.success("Ad deleted");
      router.push("/advertisements");
    } else {
      setBusy(false);
      toast.error(response.error || "Failed to delete the ad");
    }
  };

  const tiles = [
    { icon: FaChartLine, label: "Times shown", value: ad.impressions.toLocaleString("en-GB"), tone: "bg-sky-100 text-sky-600" },
    { icon: FaMousePointer, label: "Clicks", value: ad.clicks.toLocaleString("en-GB"), tone: "bg-amber-100 text-amber-600" },
    { icon: FaPercent, label: "Click rate", value: ctr(ad), tone: "bg-violet-100 text-violet-600" },
    { icon: FaBullhorn, label: "Priority", value: String(ad.priority), tone: "bg-emerald-100 text-emerald-600" },
  ];

  const rows = [
    { label: "Advertiser", value: ad.advertiser },
    { label: "Price", value: ad.priceGBP ? `£${ad.priceGBP.toFixed(2)}` : "—" },
    { label: "Button", value: ad.cta },
    {
      label: "Link",
      value: (
        <a href={ad.linkUrl} target="_blank" rel="noreferrer noopener" className="inline-flex max-w-52 items-center gap-1.5 truncate text-blue-600 hover:underline">
          <span className="truncate">{ad.linkUrl.replace(/^https?:\/\//, "")}</span> <FaExternalLinkAlt size={9} className="shrink-0" />
        </a>
      ),
    },
    { label: "Colour", value: <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: tone.color }} />{tone.label}</span> },
    { label: "Created", value: formatDateTime(ad.createdAt) },
    { label: "Last updated", value: formatDateTime(ad.updatedAt) },
  ];

  return (
    <div className={isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: tone.color }}>
            <FaBullhorn size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">{ad.headline}</h1>
            <p className={`mt-1 flex items-center gap-2 text-sm ${muted}`}>
              {ad.advertiser} ·
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status[isDarkMode ? "dark" : "light"]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.push("/advertisements")} className={outlineBtn}>
            Back
          </button>
          <button
            type="button"
            onClick={handleActive}
            disabled={busy}
            className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
              isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span className={`relative inline-flex h-5 w-9 items-center rounded-full ${ad.active ? "bg-emerald-600" : isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${ad.active ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
            {ad.active ? "On" : "Paused"}
          </button>
          <Link
            href={`/advertisements/edit/${ad._id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 ring-1 ring-white/20 transition-colors"
          >
            <FaEdit size={13} /> Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <FaTrashAlt size={12} /> Delete
          </button>
        </div>
      </div>

      {state !== "live" && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${status[isDarkMode ? "dark" : "light"]}`}>
          {state === "paused" && "Paused: patients don't see this ad. Switch it on to show it again."}
          {state === "scheduled" && `Scheduled: it starts showing on ${formatDay(ad.startDate)}.`}
          {state === "ended" && `Ended on ${formatDay(ad.endDate)}. Change the end date to run it again.`}
        </div>
      )}

      {/* Preview */}
      <section className={`${card} mb-6`}>
        <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${muted}`}>As patients see it</h2>
        <AdvertisementPreview
          advertiser={ad.advertiser}
          headline={ad.headline}
          body={ad.body}
          cta={ad.cta}
          priceGBP={ad.priceGBP}
          tone={ad.tone}
          imageUrl={ad.imageUrl}
          dark={isDarkMode}
        />
      </section>

      {/* Numbers */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, tone: t }) => (
          <div key={label} className={tile}>
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${t}`}>
              <Icon size={15} />
            </span>
            <p className={`mt-3 text-xs ${muted}`}>{label}</p>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FaMapMarkerAlt size={14} />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Where it shows</h2>
              <p className={`text-xs ${muted}`}>{scheduleLabel(ad)}</p>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {AD_SLOTS.map((slot) => {
              const on = ad.placements.includes(slot.value);
              return (
                <li
                  key={slot.value}
                  className={`rounded-lg border p-3 ${
                    on ? (isDarkMode ? "border-blue-700 bg-blue-900/30" : "border-blue-200 bg-blue-50") : isDarkMode ? "border-gray-700 opacity-50" : "border-gray-200 opacity-50"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {on ? "✓ " : ""}
                    {slot.label}
                  </p>
                  <p className={`text-xs ${muted}`}>{slot.where}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={card}>
          <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${muted}`}>Details</h2>
          <dl className="space-y-4">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <dt className={`shrink-0 text-sm ${muted}`}>{row.label}</dt>
                <dd className="text-right text-sm font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
};

export default AdvertisementDetails;
