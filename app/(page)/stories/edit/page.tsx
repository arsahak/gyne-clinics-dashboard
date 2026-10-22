import { redirect } from "next/navigation";

// Editing needs an id: /stories/edit/<id>. Without one, go back to the list.
export default function EditStoryWithoutIdPage() {
  redirect("/stories");
}
