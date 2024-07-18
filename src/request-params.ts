import { APIGatewayEvent } from "aws-lambda";
import { ApplicationError, StatusCodes } from "./http";
import { Lens, Optional } from "monocle-ts";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as R from "fp-ts/Record";
import * as TE from "fp-ts/TaskEither";
import { TaskEither } from "fp-ts/TaskEither";
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

const pathParamsIsNotNull = (event: APIGatewayEvent) =>
  TE.fromPredicate(
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
    return TE.left(
      new ApplicationError(
        "search_after & search_before should be mutually exclusive",
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (params?.limit !== undefined && isNaN(limit)) {
    return TE.left(
      new ApplicationError(
        "limit must be a number",
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (next && searchAfter && searchBefore) {
    return TE.left(
      new ApplicationError(
        "next and search_after/search_before should be mutually exclusive",
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (next) {
    return TE.right({
      next,
    });
  }

  return TE.right({
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
      TE.of<ApplicationError, APIGatewayEvent>(event),
      TE.chainFirst(pathParamsIsNotNull),
      TE.chainFirst(() =>
        pipe(
          pathParams
            .composeOptional(Optional.fromPath<PathParams>()([pathParam]))
            .getOption(event),
          TE.fromOption(
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

export class RequestParamMissingError extends ApplicationError {
  constructor(param: string) {
    super(
      "Error parsing request path params",
      [`${param} param should not be empty`],
      StatusCodes.BAD_REQUEST
    );
  }
}

export const getPathParam: <K extends string>(
  param: K
) => (event: APIGatewayEvent) => TE.TaskEither<ApplicationError, string> =
  <K extends string>(param: K) =>
  (event: APIGatewayEvent) =>
    pipe(
      O.fromNullable(event.pathParameters),
      O.chain((params) =>
        pipe(
          params,
          R.lookup(param),
          O.chain(
            O.fromPredicate(
              (value): value is string => typeof value === "string"
            )
          )
        )
      ),
      TE.fromOption(() => new RequestParamMissingError(param))
    );

/** @deprecated use extractCurrencyIdentifierParam  */
export const validateCurrencyIdentifierParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(pathParamExists("identifier"))
  );

/** @deprecated use extractTermParam  */
export const validateTermParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(pathParamExists("term"))
  );

/** @deprecated use extractHashParam  */
export const validateHashParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(pathParamExists("hash"))
  );

/** @deprecated use extractAddressParam  */
export const validateAddressParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(pathParamExists("address"))
  );
