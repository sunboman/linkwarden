import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import getFormatBasedOnPreference from "@linkwarden/lib/getFormatBasedOnPreference";
import { LinksRouteTo } from "@linkwarden/prisma/client";

const openLink = (
  link: LinkIncludingShortenedCollectionAndTags,
  user: any,
  openModal: () => void
) => {
  if (user.linksRouteTo === LinksRouteTo.DETAILS) {
    openModal();
  } else if (
    user.archiveOrgProxyDomains &&
    user.archiveOrgProxyDomains.some((domain: string) =>
      link.url?.includes(domain)
    )
  ) {
    // Auto-redirect to Archive.org Readable View
    window.open(
      `/preserved/wayback?url=${encodeURIComponent(link.url || "")}`,
      "_self"
    );
  } else if (
    link.readable &&
    link.readable !== "unavailable" &&
    link.readable !== "pending"
  ) {
    window.open(`/preserved/${link.id}?format=3`, "_self");
  } else {
    const format = getFormatBasedOnPreference({
      link,
      preference: user.linksRouteTo,
    });

    window.open(
      format !== null
        ? `/preserved/${link?.id}?format=${format}`
        : (link.url as string),
      "_blank"
    );
  }
};

export default openLink;
