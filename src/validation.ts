import { APIGatewayEvent } from 'aws-lambda';
import { ApplicationError, StatusCodes } from './http';
import {
  chain,
  chainFirst,
  left,
  of,
  right,
  TaskEither,
  fromOption,
  fromPredicate,
} from 'fp-ts/lib/TaskEither';
import * as O from 'fp-ts/lib/Option';
import { Lens, Optional } from 'monocle-ts';
import { pipe } from 'fp-ts/lib/function';
import { SearchDirection } from './query';

export type Pagination<T> =
  | {
      size?: number;
      searchDirection: SearchDirection;
      searchSince: string;
    }
  | { size?: number };

type PaginationQueryParams = {
  search_after?: string;
  search_before?: string;
  limit?: string;
};

type QueryParams = PaginationQueryParams;

const pathParams = Lens.fromNullableProp<APIGatewayEvent>()(
  'pathParameters',
  {}
);
type PathParams = NonNullable<
  APIGatewayEvent['pathParameters'] & {
    term?: string;
    address?: string;
  }
>;

const queryParams = Lens.fromNullableProp<APIGatewayEvent>()(
  'queryStringParameters',
  {}
);

const bodyNotNull = (
  event: APIGatewayEvent
): TaskEither<ApplicationError, APIGatewayEvent> =>
  pipe(
    O.of(event),
    O.chainFirst((a) => O.fromNullable(a.body)),
    fromOption(
      () =>
        new ApplicationError(
          'Error parsing request body',
          ['Body cannot be empty'],
          StatusCodes.BAD_REQUEST
        )
    )
  );

const queryParamsIsNotNull = (event: APIGatewayEvent) =>
  fromPredicate(
    () => Object.keys(queryParams.get(event)).length > 0,
    () =>
      new ApplicationError(
        'Error parsing request query params',
        ['Query params should not be empty'],
        StatusCodes.BAD_REQUEST
      )
  )(event);

const pathParamsIsNotNull = (event: APIGatewayEvent) =>
  fromPredicate(
    () => Object.keys(pathParams.get(event)).length > 0,
    () =>
      new ApplicationError(
        'Error parsing request path params',
        ['Path params should not be empty'],
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

  if (searchBefore && searchAfter) {
    return left(
      new ApplicationError(
        'search_after & search_before should be mutually exclusive',
        [],
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (params?.limit !== undefined && isNaN(limit)) {
    return left(
      new ApplicationError(
        'limit must be a number',
        [],
        StatusCodes.BAD_REQUEST
      )
    );
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
                'Error parsing request path params',
                [`${pathParam} param should not be empty`],
                StatusCodes.BAD_REQUEST
              )
          )
        )
      )
    );

const queryParamExists =
  (queryParam: keyof Partial<QueryParams>) => (event: APIGatewayEvent) =>
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
                'Error parsing request query params',
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
    chain(pathParamExists('term'))
  );

export const validateBlocksEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists('hash'))
  );

export const validateTransactionByHashEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists('hash'))
  );

export const validateTransactionByAddressEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists('address'))
  );

export const validateBalanceByAddressEvent = (event: APIGatewayEvent) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamExists('address'))
  );
