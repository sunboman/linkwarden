import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import LinkActions from "../LinkViews/LinkComponents/LinkActions";
import { useCollections } from "@linkwarden/router/collections";
import clsx from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import TextStyleDropdown from "../TextStyleDropdown";
import HighlightDrawer from "../HighlightDrawer";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  format?: ArchivedFormat;
  className?: string;
  onArchive?: () => void;
};

type ArchiveButtonProps = {
  link: LinkIncludingShortenedCollectionAndTags;
  t: ReturnType<typeof useTranslation>["t"];
  onArchive?: () => void;
};

const ArchiveButton = ({ link, t, onArchive }: ArchiveButtonProps) => {
  const queryClient = useQueryClient();

  const handleToggleArchive = async () => {
    const load = toast.loading(t("sending_request"));
    const response = await fetch(`/api/v1/links/${link.id}/toggle-archive`, {
      method: "PUT",
    });
    const data = await response.json();
    toast.dismiss(load);
    if (response.ok) {
      toast.success(data.response);
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });

      if (!link.archived && onArchive) {
        onArchive();
      }
    } else {
      toast.error(data.response);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleToggleArchive}>
      <i
        className={`${link.archived ? "bi-box-arrow-up" : "bi-archive"} text-xl`}
        title={link.archived ? t("unarchive") : t("archive")}
      />
    </Button>
  );
};

const PreservationNavbar = ({
  link,
  format,
  showNavbar,
  className,
  onArchive,
}: Props & { showNavbar?: boolean }) => {
  const { data: collections = [] } = useCollections();

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );

  const [linkModal, setLinkModal] = useState(false);
  const [highlightDrawer, setHighlightDrawer] = useState(false);

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );
  }, [collections]);

  const { t } = useTranslation();
  const router = useRouter();

  const handleDownload = () => {
    const path = `/api/v1/archives/${link?.id}?format=${format}`;
    fetch(path)
      .then((response) => {
        if (response.ok) {
          const anchorElement = document.createElement("a");
          anchorElement.href = path;
          anchorElement.download =
            format === ArchivedFormat.monolith
              ? "Webpage"
              : format === ArchivedFormat.pdf
                ? "PDF"
                : "Screenshot";
          anchorElement.click();
        } else {
          console.error("Failed to download file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <>
      <div
        className={clsx(
          "p-2 z-10 bg-base-100 flex gap-2 justify-between fixed top-0 left-0 right-0",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/links`}>
              <i className="bi-chevron-left text-lg text-neutral" />
            </Link>
          </Button>
          {format === ArchivedFormat.readability ? (
            <TextStyleDropdown />
          ) : (
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <i className="bi-cloud-arrow-down text-xl text-neutral" />
            </Button>
          )}
          {format === ArchivedFormat.readability && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHighlightDrawer(true)}
            >
              <i className="bi-highlighter text-xl text-neutral" />
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 text-neutral"
              disabled={!atLeastOneFormatAvailable(link) || false}
            >
              {format === ArchivedFormat.readability
                ? t("readable")
                : format === ArchivedFormat.monolith
                  ? t("webpage")
                  : format === ArchivedFormat.pdf
                    ? t("pdf")
                    : t("screenshot")}
              <i className="bi-chevron-down" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {formatAvailable(link, "readable") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: ArchivedFormat.readability,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={format === ArchivedFormat.readability}
              >
                {t("readable")}
              </DropdownMenuCheckboxItem>
            )}
            {formatAvailable(link, "monolith") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: ArchivedFormat.monolith,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={format === ArchivedFormat.monolith}
              >
                {t("webpage")}
              </DropdownMenuCheckboxItem>
            )}
            {formatAvailable(link, "image") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: link?.image?.endsWith(".png")
                          ? ArchivedFormat.png
                          : ArchivedFormat.jpeg,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={
                  format === ArchivedFormat.png ||
                  format === ArchivedFormat.jpeg
                }
              >
                {t("screenshot")}
              </DropdownMenuCheckboxItem>
            )}
            {formatAvailable(link, "pdf") && (
              <DropdownMenuCheckboxItem
                onSelect={() =>
                  router.push(
                    {
                      query: {
                        ...router.query,
                        format: ArchivedFormat.pdf,
                      },
                    },
                    undefined,
                    { shallow: true }
                  )
                }
                checked={format === ArchivedFormat.pdf}
              >
                {t("pdf")}
              </DropdownMenuCheckboxItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2 items-center text-neutral">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(link.url || "", "_blank")}
          >
            <i className="bi-box-arrow-up-right text-xl" title={t("open_original")} />
          </Button>
          <ArchiveButton link={link} t={t} onArchive={onArchive} />
          <LinkActions
            link={link}
            t={t}
            linkModal={linkModal}
            setLinkModal={(e) => setLinkModal(e)}
            ghost
            onArchive={onArchive}
          />
        </div>
      </div>
      {highlightDrawer && (
        <HighlightDrawer onClose={() => setHighlightDrawer(false)} />
      )}
    </>
  );
};

export default PreservationNavbar;
