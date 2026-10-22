import { getStoryById } from "@/app/actions/storyAction";
import StoryDetails from "@/component/storyManagement/StoryDetails";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /stories/:id — read and review one story. */
export default async function StoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getStoryById(id);
  if (!response.success || !response.data) redirect("/stories");
  return <StoryDetails story={response.data} />;
}
