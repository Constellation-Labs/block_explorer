import { ApiResponse } from "@opensearch-project/opensearch";
import { ApplicationError, StatusCodes } from "./http";
import { TransportRequestPromise } from "@opensearch-project/opensearch/lib/Transport";
import { pipe } from "fp-ts/lib/function";
import { filterOrElse, map, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { WithOrdinal } from "./model";
import { SearchRequest } from "@opensearch-project/opensearch/api/types";
import { Result } from "./opensearch";

export enum SortOrder {
  Desc = "desc",
  Asc = "asc",
}

export enum SearchDirection {
  After = "search_after",
  Before = "search_before",
}

export type SortOption<T> = {
  sortField: string; // path or nested path
  searchDirection?: SearchDirection;
};

export type SortOptionSince<T> = {
  sortField: string; // path or nested path
  searchSince: string | number;
  searchDirection?: SearchDirection;
};

export type SortOptions<T> = {
  options: SortOption<T>[] | SortOptionSince<T>[];
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

const isSearchSince = <T>(options: any): options is SortOptionSince<T>[] =>
  typeof options[0]?.searchSince === "string" ||
  typeof options[0]?.searchSince === "number";

const getSearchSince = <T>(sort: SortOptions<T>) => {
  return isSearchSince<T>(sort.options)
    ? { search_after: sort.options.map((a) => a.searchSince) }
    : {};
};

const getSort = <T>(sort: SortOptions<T>) => {
  return sort.options.length === 0
    ? []
    : sort.options.map((s) => ({
        [s.sortField]:
          s.searchDirection === SearchDirection.After
            ? SortOrder.Asc
            : SortOrder.Desc,
      }));
};

export const getMultiQuery = <T, K extends keyof T>(
  index: string,
  fields: K[],
  value: T[keyof T],
  sort: SortOptions<T>
): SearchRequest => ({
  index,
  body: {
    ...getSearchSince<T>(sort),
    size: sort.size || maxSizeLimit,
    sort: getSort<T>(sort),
    query: {
      bool: {
        should: fields.map((field) => ({ term: { [field]: value } })),
        minimum_should_match: 1,
        boost: 1.0,
      },
    },
  },
});

export function getByFieldQuery<T, K extends keyof T>(
  index: string,
  field: K,
  value: T[K],
  sort: SortOptions<T>
): any {
  return {
    index,
    body: {
      ...getSearchSince<T>(sort),
      size: sort.size || maxSizeLimit,
      sort: getSort<T>(sort),
      query: {
        term: {
          [field]: value,
        },
      },
    },
  };
}

export function getAll<T>(index: string, sort: SortOptions<T>): any {
  return {
    index,
    body: {
      ...getSearchSince<T>(sort),
      size: sort.size || maxSizeLimit,
      sort: getSort<T>(sort),
      query: {
        match_all: {},
      },
    },
  };
}

export const findOne = <T>(
  search: TransportRequestPromise<ApiResponse>
): TaskEither<ApplicationError, Result<T>> =>
  pipe(
    tryCatch<ApplicationError, any>(
      () => search.then((r) => (r.body.found ? [r.body] : r.body.hits.hits)),
      (err: any) => {
        if (err.meta.body?.found === false) {
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
    map((hits) => ({
      data: hits[0]._source as T,
    }))
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
    map((hits) => {
      return hits.map((hit) => hit._source as T);
    })
  );
