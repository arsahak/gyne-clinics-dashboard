import { getStoriesPage } from "@/app/actions/story";
import StoryManagement from "@/component/storyManagement/StoryManagement";

export const dynamic = "force-dynamic";

const StoriesPage = async () => {
  const response = await getStoriesPage({ status: "pending" });

  return (
    <StoryManagement
      initialStories={response.success && response.data ? response.data : []}
      initialPagination={response.pagination}
      initialStats={response.stats}
    />
  );
};

export default StoriesPage;
