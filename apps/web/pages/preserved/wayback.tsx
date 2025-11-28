import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PreservationNavbar from "@/components/Preservation/PreservationNavbar";
import { ArchivedFormat, LinkType } from "@linkwarden/types";
import { useUser } from "@linkwarden/router/user";
import PreservationPageContent from "@/components/Preservation/PreservationPageContent";

export default function WaybackReadable() {
  const router = useRouter();
  const { url } = router.query;
  const { t } = useTranslation();
  const { data: user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    url: string;
    readable?: { title: string; content: string; byline: string };
  } | null>(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    fetch(
      `/api/v1/archive/wayback?url=${encodeURIComponent(
        url as string
      )}&mode=readable`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch snapshot");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !data?.readable) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-xl text-error">
          {error || t("no_readable_content")}
        </p>
        <button className="btn btn-primary" onClick={() => router.back()}>
          {t("go_back")}
        </button>
      </div>
    );
  }

  const mockLink = {
    id: -1,
    name: data.readable.title,
    url: data.url,
    type: LinkType.url,
    description: data.readable.byline || "",
    collectionId: -1,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    collection: {
      id: -1,
      name: "Archive.org",
      ownerId: user?.id || -1,
      owner: user as any,
    },
    readable: "archives",
  } as any;

  return (
    <>
      <Head>
        <title>{data.readable.title} - Linkwarden</title>
      </Head>

      <div className="min-h-screen bg-base-100">
        <PreservationPageContent
          customLink={mockLink}
          initialContent={data.readable.content}
          customFormat={ArchivedFormat.readability}
        />
      </div>
    </>
  );
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});
