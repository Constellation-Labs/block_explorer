import { ApiResponse } from "@opensearch-project/opensearch";
import { ApplicationError, StatusCodes } from "./http";
import { TransportRequestPromise } from "@opensearch-project/opensearch/lib/Transport";
import { pipe } from "fp-ts/lib/function";
import { filterOrElse, map, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { WithOrdinal } from "./model";
import { SearchRequest } from "@opensearch-project/opensearch/api/types";

export enum SortOrder {
  Desc = "desc",
  Asc = "asc",
}

export enum SearchDirection {
  After = "search_after",
  Before = "search_before",
}

type SortOptions<T, K extends keyof T> = {
  sortField: K;
  searchSince?: string | number;
  searchDirection?: SearchDirection;
  size?: number;
};

const maxSizeLimit = 10000;

export const getDocumentQuery = <T>(index: string, id: string) => ({
  index,
  id,
});

export const getLatestQuery = <T extends WithOrdinal>(index: string): any => ({
  index,
  body: {
    size: 1,
    sort: {
      ordinal: { order: SortOrder.Desc },
    },
  },
});

export const getMultiQuery = <T, K extends keyof T, S extends keyof T>(
  index: string,
  fields: K[],
  value: T[keyof T],
  sort: SortOptions<T, S>
): SearchRequest => ({
  index,
  body: {
    ...(sort.searchSince ? { search_after: [sort.searchSince] } : {}),
    size: sort.size || maxSizeLimit,
    sort: {
      [sort.sortField]:
        sort.searchDirection === SearchDirection.After
          ? SortOrder.Asc
          : SortOrder.Desc,
    },
    query: {
      bool: {
        should: fields.map((field) => ({ term: { [field]: value } })),
        minimum_should_match: 1,
        boost: 1.0,
      },
    },
  },
});

export function getByFieldQuery<T, K extends keyof T, S extends keyof T>(
  index: string,
  field: K,
  value: T[K],
  sort: SortOptions<T, S>
): any {
  return {
    index,
    body: {
      ...(sort.searchSince ? { search_after: [sort.searchSince] } : {}),
      size: sort.size || maxSizeLimit,
      sort: {
        [sort.sortField]:
          sort.searchDirection === SearchDirection.After
            ? SortOrder.Asc
            : SortOrder.Desc,
      },
      query: {
        term: {
          [field]: value,
        },
      },
    },
  };
}

export const findOne = <T>(
  search: TransportRequestPromise<ApiResponse>
): TaskEither<ApplicationError, T> =>
  pipe(
    tryCatch<ApplicationError, any>(
      () => search.then((r) => (r.body.found ? [r.body] : r.body.hits.hits)),
      (err: any) => {
        if (err.meta?.body?.found === false) {
          return new ApplicationError("Not Found", [], StatusCodes.NOT_FOUND);
        } else {
          return new ApplicationError(
            "OpenSearch error",
            [err as string],
            StatusCodes.SERVER_ERROR
          );
        }
      }
    ),
    filterOrElse(
      (hits) => hits.length > 0,
      () => new ApplicationError("Not Found", [], StatusCodes.NOT_FOUND)
    ),
    map((hits) => hits[0]._source as T)
  );

export const findAll = <T>(
  search: TransportRequestPromise<ApiResponse>
): TaskEither<ApplicationError, T[]> =>
  pipe(
    tryCatch<ApplicationError, any>(
      () =>
        search.then((r) => {
          return r.body.hits.hits;
        }),
      (err) =>
        new ApplicationError(
          "OpenSearch error",
          [err as string],
          StatusCodes.SERVER_ERROR
        )
    ),
    filterOrElse(
      (hits) => hits.length > 0,
      () => new ApplicationError("Not Found", [], StatusCodes.NOT_FOUND)
    ),
    map((hits) => {
      return hits.map((hit) => hit._source as T);
    })
  );
