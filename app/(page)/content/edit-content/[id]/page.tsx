import { Content, getContentById, getContents } from "@/app/actions/content";
import ContentEdit from "@/component/contentManagement/ContentEdit";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const EditContentPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [contentResponse, allResponse] = await Promise.all([getContentById(id), getContents()]);

  if (!contentResponse.success || !contentResponse.data) {
    notFound();
  }

  const contents = (allResponse.success && allResponse.data ? allResponse.data : []) as Content[];
  const existingCategories = Array.from(new Set(contents.map((c) => c.category)));

  return <ContentEdit content={contentResponse.data as Content} existingCategories={existingCategories} />;
};

export default EditContentPage;
