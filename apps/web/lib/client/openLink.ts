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
