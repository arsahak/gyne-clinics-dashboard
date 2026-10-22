import { redirect } from "next/navigation";

// Editing needs a doctor id: /doctors/edit/<id>. Without one, go back to the list.
export default function EditDoctorWithoutIdPage() {
  redirect("/doctors");
}
