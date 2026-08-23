import { getStories, Story } from "@/app/actions/story";
import StoryManagement from "@/component/storyManagement/StoryManagement";

export const dynamic = "force-dynamic";

const StoriesPage = async () => {
  const response = await getStories("pending");
  const initialStories = (response.success && response.data ? response.data : []) as Story[];

  return <StoryManagement initialStories={initialStories} initialStatus="pending" />;
};

export default StoriesPage;
