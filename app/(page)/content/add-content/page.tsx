import { Content, getContents } from "@/app/actions/content";
import ContentAdd from "@/component/contentManagement/ContentAdd";

export const dynamic = "force-dynamic";

const AddContentPage = async () => {
  const response = await getContents();
  const contents = (response.success && response.data ? response.data : []) as Content[];
  const existingCategories = Array.from(new Set(contents.map((c) => c.category)));

  return <ContentAdd existingCategories={existingCategories} />;
};

export default AddContentPage;
