import { getContentsPage } from "@/app/actions/content";
import ContentList from "@/component/contentManagement/ContentList";

export const dynamic = "force-dynamic";

/** /content — the Learn feed's content. */
export default async function ContentPage() {
  const response = await getContentsPage();
  return (
    <ContentList
      initialContents={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
}
