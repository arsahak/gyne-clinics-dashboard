import { redirect } from "next/navigation";

// Editing needs an id: /content/edit/<id>. Without one, go back to the list.
export default function EditContentWithoutIdPage() {
  redirect("/content");
}
