import { ApiResponse, Client } from "@opensearch-project/opensearch";
import { ApplicationError, StatusCodes } from "./http";
import { TransportRequestPromise } from "@opensearch-project/opensearch/lib/Transport";
import { pipe } from "fp-ts/lib/pipeable";
import { filterOrElse, map, tryCatch } from "fp-ts/lib/TaskEither";

export enum SortOrder {
  Desc = "desc",
  Asc = "asc",
}

const maxSizeLimit = 10000;

export const getDocumentQuery =
  <T>(index: string, id: string) =>
  (os: Client) =>
    os.get({
      index,
      id,
    });

export const getLatestQuery = (index: string) => (os: Client) =>
  os.search({
    index,
    body: {
      size: 1,
      sort: {
        height: { order: SortOrder.Desc },
      },
      query: {
        match_all: {},
      },
    },
  });

export const getMultiQuery =
  <T>(
    index: string,
    fields: (keyof T)[],
    value: string,
    size: number | null = maxSizeLimit,
    searchAfter: number | null = +new Date(),
    order: SortOrder = SortOrder.Desc
  ) =>
  (es: Client) => {
    return es.search({
      index,
      body: {
        size,
        query: {
          bool: {
            should: fields.map((field) => ({ term: { [field]: value } })),
            minimum_should_match: 1,
            boost: 1.0,
          },
        },
      },
    });
  };

export const getByFieldQuery =
  <T>(
    index: string,
    field: keyof T | "hash",
    value: string,
    sortField: keyof T,
    size: number | null = maxSizeLimit,
    searchAfter: number | null = +new Date(),
    order: SortOrder = SortOrder.Desc // TODO: searchAfter and order must be bounded (Desc -> current timestamp, Asc -> 0)
  ) =>
  (es: Client) =>
    field === "hash"
      ? getDocumentQuery(index, value)(es)
      : es.search({
          index,
          body: {
            size,
            search_after: [searchAfter],
            sort: { [sortField]: order },
            query: {
              term: {
                [field]: value,
              },
            },
          },
        });

export const findOne = (search: TransportRequestPromise<ApiResponse>) =>
  pipe(
    tryCatch<ApplicationError, any>(
      () => search.then((r) => (r.body.found ? [r.body] : r.body.hits.hits)),
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
    map((hits) => hits[0]._source)
  );

export const findAll = <T>(search: TransportRequestPromise<ApiResponse>) =>
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
    map((hits) => hits._source)
  );
