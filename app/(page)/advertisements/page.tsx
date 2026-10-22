import { getAdvertisementsPage } from "@/app/actions/advertisementAction";
import AdvertisementList from "@/component/advertisementManagement/AdvertisementList";

export const dynamic = "force-dynamic";

/** /advertisements — ads shown in the app. */
export default async function AdvertisementsPage() {
  const response = await getAdvertisementsPage();
  return (
    <AdvertisementList
      initialAds={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
}
