import { getStoriesPage } from "@/app/actions/storyAction";
import StoryList from "@/component/storyManagement/StoryList";

export const dynamic = "force-dynamic";

/** /stories — community stories, opening on all of them (approved included). */
export default async function StoriesPage() {
  const response = await getStoriesPage({ status: "all" });
  return (
    <StoryList
      initialStories={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
      initialStatus="all"
    />
  );
}
