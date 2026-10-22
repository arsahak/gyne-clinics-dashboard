import { redirect } from "next/navigation";

// Editing needs an id: /advertisements/edit/<id>. Without one, go back to the list.
export default function EditAdvertisementWithoutIdPage() {
  redirect("/advertisements");
}
