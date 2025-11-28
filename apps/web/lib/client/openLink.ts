import {
  AccountSettings,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types";
import { generateLinkHref } from "@linkwarden/lib/generateLinkHref";
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
    window.open(generateLinkHref(link, user), "_blank");
  }
};

export default openLink;
