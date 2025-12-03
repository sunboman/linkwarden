import getServerSideProps from "@/lib/client/getServerSideProps";
import PreservationPageContent from "@/components/Preservation/PreservationPageContent";

import { useRouter } from "next/router";

export default function Index() {
  const router = useRouter();

  const handleArchive = () => {
    router.push("/links");
  };

  return <PreservationPageContent onArchive={handleArchive} />;
}

export { getServerSideProps };
