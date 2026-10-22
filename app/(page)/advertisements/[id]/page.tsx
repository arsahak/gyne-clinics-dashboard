import { getAdvertisementById } from "@/app/actions/advertisementAction";
import AdvertisementDetails from "@/component/advertisementManagement/AdvertisementDetails";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /advertisements/:id — one ad, its preview and numbers. */
export default async function AdvertisementDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getAdvertisementById(id);
  if (!response.success || !response.data) redirect("/advertisements");
  return <AdvertisementDetails ad={response.data} />;
}
