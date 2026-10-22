import { type Content, getContentById } from "@/app/actions/content";
import ContentDetails from "@/component/contentManagement/ContentDetails";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /content/:id — one piece of content, as patients read it. */
export default async function ContentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getContentById(id);
  if (!response.success || !response.data) redirect("/content");
  return <ContentDetails content={response.data as Content} />;
}
