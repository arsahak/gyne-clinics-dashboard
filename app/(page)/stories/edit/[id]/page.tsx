import { getStoryById } from "@/app/actions/storyAction";
import StoryEdit from "@/component/storyManagement/StoryEdit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /stories/edit/:id — staff corrections to one story. */
export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getStoryById(id);
  if (!response.success || !response.data) redirect("/stories");
  return <StoryEdit story={response.data} />;
}
