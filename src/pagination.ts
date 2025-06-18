import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handleError, respond } from "./response";
import { Pagination } from "./request-params";
import { toNumber, isFinite } from "lodash";
import { Prisma } from "@prisma/client";

export const maxSizeLimit = 10000;
export const defaultPageSize = 100;

export enum SortOrder {
  Desc = "desc",
  Asc = "desc",
}

export enum SearchDirection {
  After = "search_after",
  Before = "search_before",
}

const safeNumber = (value, defaultValue) => {
  const num = toNumber(value);
  return isFinite(num) && num > 0 ? num : defaultValue;
};

export const toCreatedAtCursor = (row) => ({
  created_at: new Date(row.created_at),
});
export const fromCreatedAtCursor = (row) => ({
  created_at: row.created_at.toISOString(),
});

export const toOrdinalCursor = (row) => ({
  ordinal: BigInt("0x" + row.ordinal),
});
export const fromOrdinalCursor = (row) => ({
  ordinal: row.ordinal.toString(16),
});

export const toCreatedAtOrdinalCursor = (row) => ({
  ...toCreatedAtCursor(row),
  ...toOrdinalCursor(row),
});
export const fromCreatedAtOrdinalCursor = (row) => ({
  ...fromCreatedAtCursor(row),
  ...fromOrdinalCursor(row),
});

export const hashCursor = (row) => ({ hash: row.hash });

const buildPageQuery = <T>(pagination: Pagination, nextToCursor) => {
  const pageSize = safeNumber(pagination.size, defaultPageSize);
  const incrementedSize = pageSize + 1;

  if (
    pagination &&
    "searchSince" in pagination &&
    pagination.searchSince &&
    "searchDirection" in pagination &&
    pagination.searchDirection
  ) {
    const page =
      pagination.searchDirection === SearchDirection.Before
        ? incrementedSize
        : -incrementedSize;

    return {
      take: page,
      skip: pagination.searchDirection === SearchDirection.Before ? 1 : 0,
      cursor: pagination.searchSince,
    };
  }

  if (pagination && "next" in pagination) {
    return { take: incrementedSize, cursor: nextToCursor(pagination.next) };
  }

  if (pagination && pagination.size) {
    return { take: incrementedSize };
  }

  return { take: incrementedSize };
};

export const paginatedQuery = async (
  pagination,
  nextToCursor,
  cursorToNext,
  baseQuery,
  findMany,
  transformResponse
): Promise<APIGatewayProxyResult> => {
  try {
    const pageQueryParams = buildPageQuery(pagination, nextToCursor);

    const pagedQuery = {
      ...baseQuery,
      ...(pagination ? pageQueryParams : {}),
    };

    const withCursorQuery = withCursorSafeOrdering(pagedQuery);

    const rawResults = await findMany(withCursorQuery);
    const pageSize = pageQueryParams.take
      ? pageQueryParams.take - 1
      : maxSizeLimit;
    const hasNextPage = rawResults.length > pageSize;

    let result = rawResults;
    let next;
    if (hasNextPage) {
      result = rawResults.slice(0, -1);
      const last = rawResults.at(-1);
      next = cursorToNext(last);
    }
    return respond(result, transformResponse, next);
  } catch (error) {
    return handleError(error);
  }
};

function withCursorSafeOrdering(query, searchSince?: { hash: string }) {
  if (!searchSince) return query;

  const originalOrder = query.orderBy;

  const extendedOrder = Array.isArray(originalOrder)
    ? [...originalOrder, { hash: "desc" }]
    : originalOrder
    ? [originalOrder, { hash: "desc" }]
    : [{ hash: "desc" }];

  return {
    ...query,
    orderBy: extendedOrder,
  };
}
