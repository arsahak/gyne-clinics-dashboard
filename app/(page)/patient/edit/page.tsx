import { redirect } from "next/navigation";

// Editing needs a patient id: /patient/<id>. Without one, go back to the list.
export default function EditPatientWithoutIdPage() {
  redirect("/patient");
}
