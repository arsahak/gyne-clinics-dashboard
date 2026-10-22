import { type Content, getContentById } from "@/app/actions/content";
import ContentEdit from "@/component/contentManagement/ContentEdit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /content/edit/:id — edit one piece of content. */
export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getContentById(id);
  if (!response.success || !response.data) redirect("/content");
  return <ContentEdit content={response.data as Content} />;
}
