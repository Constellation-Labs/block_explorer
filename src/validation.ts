import { APIGatewayEvent } from "aws-lambda";
import { ApplicationError, StatusCodes } from "./http";
import {
  chain,
  chainFirst,
  left,
  of,
  right,
  TaskEither,
  fromOption,
  fromPredicate,
} from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { Lens, Optional } from "monocle-ts";
import { pipe } from "fp-ts/lib/function";

const pathParams = Lens.fromNullableProp<APIGatewayEvent>()(
  "pathParameters",
  {}
);
type PathParams = NonNullable<
  APIGatewayEvent["pathParameters"] & {
    term?: string;
  }
>;

const queryParams = Lens.fromNullableProp<APIGatewayEvent>()(
  "queryStringParameters",
  {}
);
type QueryParams = NonNullable<APIGatewayEvent["queryStringParameters"]> & {
  ordinal?: number;
};

const bodyNotNull = (
  event: APIGatewayEvent
): TaskEither<ApplicationError, APIGatewayEvent> =>
  pipe(
    O.of(event),
    O.chainFirst((a) => O.fromNullable(a.body)),
    fromOption(
      () =>
        new ApplicationError(
          "Error parsing request body",
          ["Body cannot be empty"],
          StatusCodes.BAD_REQUEST
        )
    )
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

const searchAfterAndLimitNeitherOrBothNull = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(() => {
      const searchAfter = queryParams
        .compose(Lens.fromProp<QueryParams>()("search_after"))
        .get(event);
      const limit = queryParams
        .compose(Lens.fromProp<QueryParams>()("limit"))
        .get(event);

      const areBoth = searchAfter && limit;
      const areNone = !searchAfter && !limit;

      return areBoth || areNone
        ? right<ApplicationError, APIGatewayEvent>(event)
        : left<ApplicationError, APIGatewayEvent>(
            new ApplicationError(
              "Error parsing request query params",
              ["Both search_after and limit should not be empty"],
              StatusCodes.BAD_REQUEST
            )
          );
    })
  );

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

const queryParamExists =
  (queryParam: keyof Partial<PathParams>) => (event: APIGatewayEvent) =>
    pipe(
      of<ApplicationError, APIGatewayEvent>(event),
      chainFirst(queryParamsIsNotNull),
      chainFirst(() =>
        pipe(
          queryParams
            .composeOptional(Optional.fromPath<QueryParams>()([queryParam]))
            .getOption(event),
          fromOption(
            () =>
              new ApplicationError(
                "Error parsing request query params",
                [`${queryParam} query param should not be empty`],
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
    chain(pathParamExists("address")),
    chain(queryParamExists("ordinal"))
  );
