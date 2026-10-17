import { getAdvertisementsPage } from "@/app/actions/advertisementManagement";
import AdvertisementManagement from "@/component/advertisementManagement/AdvertisementManagement";

export const dynamic = "force-dynamic";

const AdvertisementsPage = async () => {
  const response = await getAdvertisementsPage();

  return (
    <AdvertisementManagement
      initialAds={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
};

export default AdvertisementsPage;
