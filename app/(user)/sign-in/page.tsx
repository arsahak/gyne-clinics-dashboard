import DashboardBackdrop from "@/component/auth/DashboardBackdrop";
import SigninPage from "@/component/auth/SigninPage";
import { Suspense } from "react";

export const metadata = {
  title: "GyneClinics – Expertise Professionalism and Excellence",
  description:
    "We uphold the highest standards of medical ethics, ensuring total confidentiality, safety, and respect for every patient.",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-USA",
    },
  },
  openGraph: {
    images: "/opengraph-image.jpg",
  },
};

const page = () => {
  return (
    <>
      {/* Blurred dashboard preview (sample data) behind the sign-in card */}
      <DashboardBackdrop />
      <Suspense fallback={<div>Loading...</div>}>
        <SigninPage />
      </Suspense>
    </>
  );
};

export default page;
