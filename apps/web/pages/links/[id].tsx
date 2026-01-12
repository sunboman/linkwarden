import LinkDetails from "@/components/LinkDetails";
import { useGetLink } from "@linkwarden/router/links";
import { useRouter } from "next/router";
import getServerSideProps from "@/lib/client/getServerSideProps";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";

const Index = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;

  let isPublicRoute = router.pathname.startsWith("/public") ? true : undefined;

  const { data, refetch } = useGetLink({
    id: Number(id) as number,
    isPublicRoute,
  });

  const updateArchive = async () => {
    const load = toast.loading(t("sending_request"));

    const response = await fetch(`/api/v1/links/${data?.id}/archive`, {
      method: "PUT",
    });

    const resData = await response.json();
    toast.dismiss(load);

    if (response.ok) {
      refetch().catch((error) => {
        console.error("Error fetching link:", error);
      });

      toast.success(t("link_being_archived"));
    } else toast.error(resData.response);
  };

  return (
    <div className="flex h-screen">
      {data?.id ? (
        <LinkDetails
          activeLink={data}
          className="sm:max-w-xl sm:m-auto sm:p-5 w-full"
          standalone
          onUpdateArchive={updateArchive}
        />
      ) : (
        <div className="max-w-xl p-5 m-auto w-full flex flex-col items-center gap-5">
          <div className="w-20 h-20 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
        </div>
      )}
    </div>
  );
};

export default Index;

export { getServerSideProps };
