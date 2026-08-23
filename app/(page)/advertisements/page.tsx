import { AdvertisementRecord, getAdvertisements } from "@/app/actions/advertisementManagement";
import AdvertisementManagement from "@/component/advertisementManagement/AdvertisementManagement";

export const dynamic = "force-dynamic";

const AdvertisementsPage = async () => {
  const response = await getAdvertisements("all");
  const initialAds = (response.success && response.data ? response.data : []) as AdvertisementRecord[];

  return <AdvertisementManagement initialAds={initialAds} initialPlacement="all" />;
};

export default AdvertisementsPage;
