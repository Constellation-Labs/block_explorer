import { APIGatewayEvent } from "aws-lambda";
import { ApplicationError, StatusCodes } from "./http";
import {
  chain,
  chainFirst,
  fromOption,
  fromPredicate,
  left,
  of,
  right,
  TaskEither,
} from "fp-ts/lib/TaskEither";
import { Lens, Optional } from "monocle-ts";
import { pipe } from "fp-ts/lib/function";
import { SearchDirection, SortOptions } from "./query";

export type Pagination<T> =
  | {
      size?: number;
      searchDirection: SearchDirection;
      searchSince: string;
    }
  | { size?: number }
  | { size?: number; next: string };

type PaginationQueryParams = {
  search_after?: string;
  search_before?: string;
  limit?: string;
  next?: string;
};

type QueryParams = PaginationQueryParams;

const pathParams = Lens.fromNullableProp<APIGatewayEvent>()(
  "pathParameters",
  {}
);
type PathParams = NonNullable<
  APIGatewayEvent["pathParameters"] & {
    hash?: string;
    term?: string;
    address?: string;
  }
>;

const queryParams = Lens.fromNullableProp<APIGatewayEvent>()(
  "queryStringParameters",
  {}
);

const queryParamsIsNotNull = (event: APIGatewayEvent) =>
  fromPredicate(
    () => Object.keys(queryParams.get(event)).length > 0,
    () =>
      new ApplicationError(
        "Error parsing request query params",
        ["Query params should not be empty"],
        StatusCodes.BAD_REQUEST
      )
  )(event);

const pathParamsIsNotNull = (event: APIGatewayEvent) =>
  fromPredicate(
    () => Object.keys(pathParams.get(event)).length > 0,
    () =>
      new ApplicationError(
        "Error parsing request path params",
        ["Path params should not be empty"],
        StatusCodes.BAD_REQUEST
      )
  )(event);

export const extractPagination = <T>(
  event: APIGatewayEvent
): TaskEither<ApplicationError, Pagination<T>> => {
  const params = event.queryStringParameters as PaginationQueryParams;
  const searchBefore = params?.search_before;
  const searchAfter = params?.search_after;
  const limit = Number(params?.limit);
  const next = params?.next;

  if (searchBefore && searchAfter) {
    return left(
      new ApplicationError(
        "search_after & search_before should be mutually exclusive",
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (params?.limit !== undefined && isNaN(limit)) {
    return left(
      new ApplicationError(
        "limit must be a number",
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (next && searchAfter && searchBefore) {
    return left(
      new ApplicationError(
        "next and search_after/search_before should be mutually exclusive",
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (next) {
    return right({
      next,
    });
  }

  return right({
    searchSince: searchAfter || searchBefore,
    searchDirection:
      (searchAfter && SearchDirection.After) ||
      (searchBefore && SearchDirection.Before) ||
      undefined,
    size: limit,
  });
};

export const toNextString = <T>(options: SortOptions<T>): string => {
  const buffer = Buffer.from(JSON.stringify(options));
  return buffer.toString("base64");
};

export const fromNextString = <T>(next: string): SortOptions<T> => {
  const buffer = Buffer.from(next, "base64");
  return JSON.parse(buffer.toString("ascii"));
};

const pathParamExists =
  (pathParam: keyof Partial<PathParams>) => (event: APIGatewayEvent) =>
    pipe(
      of<ApplicationError, APIGatewayEvent>(event),
      chainFirst(pathParamsIsNotNull),
      chainFirst(() =>
        pipe(
          pathParams
            .composeOptional(Optional.fromPath<PathParams>()([pathParam]))
            .getOption(event),
          fromOption(
            () =>
              new ApplicationError(
                "Error parsing request path params",
                [`${pathParam} param should not be empty`],
                StatusCodes.BAD_REQUEST
              )
          )
        )
      )
    );

export const validateSnapshotsEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists("term"))
  );

export const validateBlocksEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists("hash"))
  );

export const validateTransactionByHashEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists("hash"))
  );

export const validateTransactionByAddressEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists("address"))
  );

export const validateBalanceByAddressEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists("address"))
  );
