import { getAdvertisementById } from "@/app/actions/advertisementAction";
import AdvertisementEdit from "@/component/advertisementManagement/AdvertisementEdit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /advertisements/edit/:id — edit one ad. */
export default async function EditAdvertisementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getAdvertisementById(id);
  if (!response.success || !response.data) redirect("/advertisements");
  return <AdvertisementEdit advertisement={response.data} />;
}
