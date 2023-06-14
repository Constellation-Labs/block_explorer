import { ApiResponse } from "@opensearch-project/opensearch";
import { ApplicationError, StatusCodes } from "./http";
import { TransportRequestPromise } from "@opensearch-project/opensearch/lib/Transport";
import { pipe } from "fp-ts/lib/function";
import { filterOrElse, map, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { CurrencyData, Ordinal } from "./model";
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

export const maxSizeLimit = 10000;

export const getDocumentQuery = <T>(
  index: string,
  id: string,
  currencyIdentifier?: string
) => ({
  index,
  id: currencyIdentifier ? currencyIdentifier + id : id,
});

export const getLatestQuery = <T extends Ordinal>(
  index: string,
  currencyIdentifier?: string
): any => ({
  index,
  body: {
    size: 1,
    sort: {
      [currencyIdentifier ? "data.ordinal" : "ordinal"]: {
        order: SortOrder.Desc,
      },
    },
    ...(currencyIdentifier
      ? {
          query: {
            bool: { must: [{ match: { identifier: currencyIdentifier } }] },
          },
        }
      : {}),
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

const getSort = <T>(sort: SortOptions<T>, currencyIdentifier?: string) => {
  return sort.options.length === 0
    ? []
    : sort.options.map((s) => ({
        [currencyIdentifier ? `data.${s.sortField}` : s.sortField]:
          s.searchDirection === SearchDirection.After
            ? SortOrder.Asc
            : SortOrder.Desc,
      }));
};

export const getMultiQuery = <T, K extends keyof T>(
  index: string,
  fields: K[],
  value: T[keyof T],
  sort: SortOptions<T>,
  currencyIdentifier?: string
): SearchRequest => ({
  index,
  body: {
    ...getSearchSince<T>(sort),
    size: sort.size || maxSizeLimit,
    sort: getSort<T>(sort, currencyIdentifier),
    query: {
      bool: {
        should: fields.map((field) => ({
          term: {
            [currencyIdentifier ? `data.${String(field)}` : field]: value,
          },
        })),
        ...(currencyIdentifier
          ? { must: [{ match: { identifier: currencyIdentifier } }] }
          : {}),
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
  sort: SortOptions<T>,
  currencyIdentifier?: string
): any {
  return {
    index,
    body: {
      ...getSearchSince<T>(sort),
      size: sort.size || maxSizeLimit,
      sort: getSort<T>(sort, currencyIdentifier),
      query: {
        bool: {
          must: [
            {
              term: {
                [currencyIdentifier ? `data.${String(field)}` : field]: value,
              },
            },
            ...(currencyIdentifier
              ? [{ term: { identifier: currencyIdentifier } }]
              : []),
          ],
        },
      },
    },
  };
}

export function getAll<T>(
  index: string,
  sort: SortOptions<T>,
  currencyIdentifier?: string
): any {
  return {
    index,
    body: {
      ...getSearchSince<T>(sort),
      size: sort.size || maxSizeLimit,
      sort: getSort<T>(sort, currencyIdentifier),
      query: currencyIdentifier
        ? {
            bool: {
              must: [{ term: { identifier: currencyIdentifier } }],
            },
          }
        : {
            match_all: {},
          },
    },
  };
}

export const findOne = <T>(
  search: TransportRequestPromise<ApiResponse>,
  currencyIdentifier?: string
): TaskEither<ApplicationError, Result<T>> =>
  pipe(
    tryCatch<ApplicationError, any>(
      () => search.then((r) => (r.body.found ? [r.body] : r.body.hits.hits)),
      (err: any) => {
        if (err.meta?.body?.found === false) {
          return new ApplicationError("Not Found", [""], StatusCodes.NOT_FOUND);
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
    })),
    map((h) => {
      // console.log(currencyIdentifier, isWrapped(h.data))
      return isWrapped<T>(h.data) && currencyIdentifier
        ? { ...h, data: h.data.data }
        : h;
    })
  );

export const findAll = <T>(
  search: TransportRequestPromise<ApiResponse>,
  currencyIdentifier?: string
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
    }),
    map((hits) =>
      hits.map((h) => (isWrapped(h) && currencyIdentifier ? h.data : h))
    )
  );

const isWrapped = <T>(a: any): a is CurrencyData<T> => a.identifier && a.data;
