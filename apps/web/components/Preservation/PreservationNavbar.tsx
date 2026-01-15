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


const PreservationNavbar = ({
  link,
  format,
  showNavbar,
  className,
  onArchive,
}: Props & { showNavbar?: boolean }) => {
  const queryClient = useQueryClient();
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
      {/* Top Navbar - hides on scroll */}
      <div
        className={clsx(
          "p-2 z-10 flex gap-2 justify-between fixed top-0 left-0 right-0 transition-transform duration-300 ease-in-out",
          "border-b shadow-lg",
          showNavbar ? "translate-y-0" : "-translate-y-full",
          className
        )}
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          backgroundColor: "rgba(40, 40, 45, 0.75)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
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

      {/* Floating Action Pill - bottom center, hides on scroll */}
      <div
        className={clsx(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 ease-in-out",
          "border shadow-lg",
          showNavbar ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
        )}
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          backgroundColor: "rgba(40, 40, 45, 0.75)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-neutral hover:bg-white/20 dark:hover:bg-white/10 rounded-full"
          onClick={() => window.open(link.url || "", "_blank")}
        >
          <i className="bi-box-arrow-up-right text-lg" />
          <span className="ml-1.5 text-sm font-medium">Open</span>
        </Button>
        <div className="w-px h-5 bg-white/30 dark:bg-white/10" />
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-neutral hover:bg-white/20 dark:hover:bg-white/10 rounded-full"
          onClick={async () => {
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
          }}
        >
          <i className={`${link.archived ? "bi-box-arrow-up" : "bi-archive"} text-lg`} />
          <span className="ml-1.5 text-sm font-medium">
            {link.archived ? t("unarchive") : t("archive")}
          </span>
        </Button>
      </div>

      {highlightDrawer && (
        <HighlightDrawer onClose={() => setHighlightDrawer(false)} />
      )}
    </>
  );
};

export default PreservationNavbar;
