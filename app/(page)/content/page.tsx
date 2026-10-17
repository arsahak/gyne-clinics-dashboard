import { getContentsPage } from "@/app/actions/content";
import ContentManagement from "@/component/contentManagement/ContentManagement";

export const dynamic = "force-dynamic";

const ContentPage = async () => {
  const response = await getContentsPage();

  return (
    <ContentManagement
      initialContents={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
      initialCategories={response.categories ?? []}
    />
  );
};

export default ContentPage;
