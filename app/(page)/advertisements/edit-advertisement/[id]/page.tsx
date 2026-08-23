import { AdvertisementRecord, getAdvertisements } from "@/app/actions/advertisementManagement";
import AdvertisementEdit from "@/component/advertisementManagement/AdvertisementEdit";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const EditAdvertisementPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const response = await getAdvertisements("all");
  const ads = (response.success && response.data ? response.data : []) as AdvertisementRecord[];
  const advertisement = ads.find((a) => a._id === id);

  if (!advertisement) {
    notFound();
  }

  return <AdvertisementEdit advertisement={advertisement} />;
};

export default EditAdvertisementPage;
