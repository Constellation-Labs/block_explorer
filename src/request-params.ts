import { APIGatewayEvent } from "aws-lambda";
import { maxSizeLimit, SearchDirection } from "./pagination";

export type Pagination =
  | {
      size?: number;
      searchDirection: SearchDirection;
      searchSince:
        | { hash: string }
        | { metagraph_id: string; hash: string }
        | { metagraph_id_hash: { metagraph_id: string; hash: string } }
        | { id: string }
        | undefined;
    }
  | { size?: number }
  | { size?: number; next: any };

type PaginationQueryParams = {
  search_after?: string;
  search_before?: string;
  limit?: string;
  next?: string;
};

export const extractHashOrdinal = (term) => {
  if (isNaN(Number(term))) {
    return { hash: term };
  } else {
    return { ordinal: BigInt(term) };
  }
};

export const extractPagination = (event: APIGatewayEvent): Pagination => {
  const params = event.queryStringParameters as PaginationQueryParams;
  const searchBefore = params?.search_before;
  const searchAfter = params?.search_after;
  const limit = Number(params?.limit);
  const next = params?.next;

  if (searchBefore && searchAfter) {
    throw new Error(
      "search_after & search_before should be mutually exclusive"
    );
  }

  if (params?.limit !== undefined) {
    if (isNaN(limit)) {
      throw new Error("limit must be a number");
    }

    if (limit < 1) {
      throw new Error("limit must be a positive number");
    }

    if (limit > maxSizeLimit) {
      throw new Error(`limit must be lower or equal ${maxSizeLimit}`);
    }
  }

  if (next && searchAfter && searchBefore) {
    throw new Error(
      "next and search_after/search_before should be mutually exclusive"
    );
  }

  if (next) {
    return {
      next: fromNextString(next),
      size: params.limit !== undefined ? limit : undefined,
    };
  }

  let searchSince;

  if (searchAfter) {
    searchSince = { hash: searchAfter };
  } else if (searchBefore) {
    searchSince = { hash: searchBefore };
  }

  return {
    searchSince,
    searchDirection:
      (searchAfter && SearchDirection.After) ||
      (searchBefore && SearchDirection.Before) ||
      undefined,
    size: limit,
  };
};

export const toNextString = (next): string => {
  const buffer = Buffer.from(JSON.stringify(next));
  return buffer.toString("base64");
};

export const fromNextString = (next: string) => {
  const buffer = Buffer.from(next, "base64");
  return JSON.parse(buffer.toString("ascii"));
};
