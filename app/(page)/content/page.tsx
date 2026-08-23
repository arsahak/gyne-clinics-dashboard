import { Content, getContents } from "@/app/actions/content";
import ContentManagement from "@/component/contentManagement/ContentManagement";

export const dynamic = "force-dynamic";

const ContentPage = async () => {
  const response = await getContents();
  const initialContents = (response.success && response.data ? response.data : []) as Content[];

  return <ContentManagement initialContents={initialContents} initialCategory="All" />;
};

export default ContentPage;
