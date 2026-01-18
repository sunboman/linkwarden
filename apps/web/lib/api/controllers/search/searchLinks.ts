import { prisma } from "@linkwarden/prisma";
import { LinkRequestQuery, Order, Sort } from "@linkwarden/types";
import { meiliClient } from "@linkwarden/lib";
import {
  buildMeiliFilters,
  buildMeiliQuery,
  parseSearchTokens,
} from "../../searchQueryBuilder";

interface SearchLinksParams {
  query: LinkRequestQuery;
  userId?: number;
  publicOnly?: boolean;
}

export default async function searchLinks({
  query,
  userId,
  publicOnly,
}: SearchLinksParams) {
  const POSTGRES_IS_ENABLED =
    process.env.DATABASE_URL?.startsWith("postgresql");

  const paginationTakeCount = Number(process.env.PAGINATION_TAKE_COUNT) || 50;

  let order: Order = { id: "desc" };
  let sortByReadingProgress: Sort | null = null;

  if (query.sort === Sort.DateNewestFirst) order = { id: "desc" };
  else if (query.sort === Sort.DateOldestFirst) order = { id: "asc" };
  else if (query.sort === Sort.NameAZ) order = { name: "asc" };
  else if (query.sort === Sort.NameZA) order = { name: "desc" };
  else if (
    query.sort === Sort.ReadingProgressHighFirst ||
    query.sort === Sort.ReadingProgressLowFirst ||
    query.sort === Sort.LastReadNewestFirst ||
    query.sort === Sort.LastReadOldestFirst
  ) {
    // Prisma doesn't support orderBy on related model aggregates
    // We'll sort in application after fetching
    sortByReadingProgress = query.sort;
    order = { id: "desc" }; // default order for DB query
  }

  // Helper function to sort by reading progress in application
  // For Last Read sorting: use readingProgress.updatedAt if read, otherwise fall back to createdAt
  const sortByReadingProgressFn = <T extends {
    readingProgress?: { percent: number; updatedAt: Date }[];
    createdAt: Date;
  }>(
    links: T[],
    sortType: Sort
  ): T[] => {
    return [...links].sort((a, b) => {
      const aProgress = a.readingProgress?.[0];
      const bProgress = b.readingProgress?.[0];

      if (sortType === Sort.ReadingProgressHighFirst) {
        return (bProgress?.percent ?? 0) - (aProgress?.percent ?? 0);
      } else if (sortType === Sort.ReadingProgressLowFirst) {
        return (aProgress?.percent ?? 0) - (bProgress?.percent ?? 0);
      } else if (sortType === Sort.LastReadNewestFirst) {
        // For read links: use last read time; for unread links: use added time
        const aTime = aProgress?.updatedAt
          ? new Date(aProgress.updatedAt).getTime()
          : new Date(a.createdAt).getTime();
        const bTime = bProgress?.updatedAt
          ? new Date(bProgress.updatedAt).getTime()
          : new Date(b.createdAt).getTime();
        return bTime - aTime;
      } else if (sortType === Sort.LastReadOldestFirst) {
        // For read links: use last read time; for unread links: use added time
        const aTime = aProgress?.updatedAt
          ? new Date(aProgress.updatedAt).getTime()
          : new Date(a.createdAt).getTime();
        const bTime = bProgress?.updatedAt
          ? new Date(bProgress.updatedAt).getTime()
          : new Date(b.createdAt).getTime();
        return aTime - bTime;
      }
      return 0;
    });
  };

  const tagCondition = [];
  if (query.tagId) {
    tagCondition.push({
      tags: {
        some: { id: query.tagId },
      },
    });
  }

  const collectionCondition = [];
  if (query.collectionId || publicOnly) {
    collectionCondition.push({
      collection: {
        id: query.collectionId,
        ...(publicOnly ? { isPublic: true } : {}),
      },
    });
  }

  const pinnedCondition =
    query.pinnedOnly && userId ? { pinnedBy: { some: { id: userId } } } : {};

  if (meiliClient && query.searchQueryString) {
    const tokens = parseSearchTokens(query.searchQueryString);
    const meiliQuery = buildMeiliQuery(tokens);

    const meiliFilters = buildMeiliFilters({
      tokens,
      userId,
      publicOnly,
    });

    const limit = paginationTakeCount;
    const offset = query.cursor || 0;

    const meiliResp = await meiliClient.index("links").search(meiliQuery, {
      filter: meiliFilters,
      attributesToRetrieve: ["id"],
      limit,
      offset,
      sort:
        query.sort === Sort.DateNewestFirst
          ? ["id:desc"]
          : query.sort === Sort.DateOldestFirst
            ? ["id:asc"]
            : query.sort === Sort.NameAZ
              ? ["name:asc"]
              : query.sort === Sort.NameZA
                ? ["name:desc"]
                : ["id:desc"],
    });

    if (meiliResp.hits.length === 0) {
      return {
        data: [],
        statusCode: 200,
        success: true,
        message: "Nothing found.",
      };
    }

    const meiliIds = meiliResp.hits.map((h: any) => h.id);

    const links = await prisma.link.findMany({
      where: {
        id: { in: meiliIds },
        AND: [
          ...(userId
            ? [
              {
                collection: {
                  OR: [
                    { ownerId: userId },
                    {
                      members: {
                        some: { userId },
                      },
                    },
                  ],
                },
              },
            ]
            : []),
          ...collectionCondition,
          { archived: query.archived ?? false },
          {
            OR: [
              ...tagCondition,
              {
                ...pinnedCondition,
              },
            ],
          },
        ],
      },
      omit: {
        textContent: true,
      },
      include: {
        tags: true,
        collection: true,
        pinnedBy: userId
          ? {
            where: { id: userId },
            select: { id: true },
          }
          : undefined,
        readingProgress: userId
          ? {
            where: { userId },
            select: { percent: true, updatedAt: true },
          }
          : undefined,
      },
      orderBy: order,
    });

    const nextCursor = meiliResp.hits.length === limit ? offset + limit : null;

    const sortedLinks = sortByReadingProgress
      ? sortByReadingProgressFn(links, sortByReadingProgress)
      : links;

    return {
      data: {
        links: sortedLinks,
        nextCursor,
      },
      statusCode: 200,
      success: true,
      message: "Success",
    };
  }

  // Fallback: No Meilisearch
  const searchConditions = [];

  if (query.searchQueryString) {
    searchConditions.push({
      name: {
        contains: query.searchQueryString,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      url: {
        contains: query.searchQueryString,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      description: {
        contains: query.searchQueryString,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      tags: {
        some: {
          name: {
            contains: query.searchQueryString,
            mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
          },
        },
      },
    });
  }

  const links = await prisma.link.findMany({
    take: paginationTakeCount,
    skip: query.cursor ? 1 : undefined,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    where: {
      AND: [
        ...(userId
          ? [
            {
              collection: {
                OR: [
                  { ownerId: userId },
                  {
                    members: {
                      some: { userId },
                    },
                  },
                ],
              },
            },
          ]
          : []),
        ...collectionCondition,
        { archived: query.archived ?? false },
        {
          OR: [
            ...tagCondition,
            {
              [query.searchQueryString ? "OR" : "AND"]: [
                pinnedCondition,
                ...searchConditions,
              ],
            },
          ],
        },
      ],
    },
    omit: {
      textContent: true,
    },
    include: {
      tags: true,
      collection: true,
      pinnedBy: userId
        ? {
          where: { id: userId },
          select: { id: true },
        }
        : undefined,
      readingProgress: userId
        ? {
          where: { userId },
          select: { percent: true, updatedAt: true },
        }
        : undefined,
    },
    orderBy: order,
  });

  const sortedLinks = sortByReadingProgress
    ? sortByReadingProgressFn(links, sortByReadingProgress)
    : links;

  return {
    data: {
      links: sortedLinks,
      nextCursor:
        links.length === paginationTakeCount
          ? links[links.length - 1].id
          : null,
    },
    statusCode: 200,
    success: true,
    message: "Success",
  };
}
