import { Client } from "@opensearch-project/opensearch";
import { APIGatewayEvent } from "aws-lambda";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { Task } from "fp-ts/lib/Task";
import { chain, fold, map, of } from "fp-ts/lib/TaskEither";
import {
  ApplicationError,
  errorResponse,
  Response,
  StatusCodes,
  successResponse,
} from "./http";

import {
  extractPagination,
  validateTermParam,
  validateAddressParam,
  validateHashParam,
  validateCurrencyIdentifierParam,
  getPathParam,
} from "./request-params";
import {
  findBalanceByAddress,
  findBlockByHash,
  findCurrencyFeeTransactionByHash,
  findCurrencyFeeTransactionsByAddress,
  findCurrencyFeeTransactionsByDestination,
  findCurrencyFeeTransactionsBySnapshot,
  findCurrencyFeeTransactionsBySource,
  findCurrencySnapshotsByOwnerAddress,
  findSnapshot,
  findSnapshotRewards,
  findTransactionByHash,
  findTransactionsByAddress,
  findTransactionsByDestination,
  findTransactionsBySnapshot,
  findTransactionsBySource,
  listMetagraphs,
  listSnapshots,
  listTransactions,
} from "./opensearch";
import { pipe } from "fp-ts/lib/function";
import { OpenSearchCurrencySnapshotV1 } from "./model/currency-snapshot";

export const getCurrencySnapshots = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    chain(() =>
      pipe(
        extractPagination(event),
        map((pagination) => {
          return { pagination, ...extractCurrencyIdentifier(event) };
        })
      )
    ),
    chain(({ pagination, currencyIdentifier }) =>
      listSnapshots<OpenSearchCurrencySnapshotV1>(os)(
        pagination,
        currencyIdentifier
      )
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencySnapshotsByOwnerAddress = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    TE.Do,
    TE.bind("pagination", () => extractPagination(event)),
    TE.bind("ownerAddress", () => extractAddressParam(event)),
    TE.chain(({ pagination, ownerAddress }) =>
      findCurrencySnapshotsByOwnerAddress(os)(ownerAddress, pagination)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshots = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(() =>
      pipe(
        extractPagination(event),
        map((pagination) => {
          return { pagination };
        })
      )
    ),
    chain(({ pagination }) => listSnapshots(os)(pagination, null)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshot = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTermParam),
    map(extractTerm),
    chain(({ termName, termValue }) => findSnapshot(os)(termValue, null)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencySnapshot = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    chain(validateTermParam),
    map((event) => ({
      ...extractTerm(event),
      ...extractCurrencyIdentifier(event),
    })),
    chain(({ termName, termValue, currencyIdentifier }) =>
      findSnapshot<OpenSearchCurrencySnapshotV1>(os)(
        termValue,
        currencyIdentifier
      )
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshotRewards = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTermParam),
    map(extractTerm),
    chain(({ termName, termValue }) =>
      findSnapshotRewards(os)(termValue, null)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencySnapshotRewards = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    chain(validateTermParam),
    map((event) => ({
      ...extractTerm(event),
      ...extractCurrencyIdentifier(event),
    })),
    chain(({ termName, termValue, currencyIdentifier }) =>
      findSnapshotRewards(os)(termValue, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshotTransactions = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTermParam),
    map(extractTerm),
    chain(({ termName, termValue }) =>
      pipe(
        extractPagination(event),
        map((pagination) => ({ termName, termValue, pagination }))
      )
    ),
    chain(({ termName, termValue, pagination }) =>
      findTransactionsBySnapshot(os)(termValue, pagination, null)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencySnapshotTransactions = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTermParam),
    chain(validateCurrencyIdentifierParam),
    map((event) => ({
      ...extractTerm(event),
      ...extractCurrencyIdentifier(event),
    })),
    chain(({ termName, termValue, currencyIdentifier }) =>
      pipe(
        extractPagination(event),
        map((pagination) => ({
          termName,
          termValue,
          pagination,
          currencyIdentifier,
        }))
      )
    ),
    chain(({ termName, termValue, pagination, currencyIdentifier }) =>
      findTransactionsBySnapshot(os)(termValue, pagination, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencySnapshotFeeTransactions = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    TE.Do,
    TE.bind("identifier", () => extractCurrencyIdentifierParam(event)),
    TE.bind("term", () => extractTermParam(event)),
    TE.bind("pagination", () => extractPagination(event)),
    TE.chain(({ identifier, term: { termValue }, pagination }) => {
      console.log("params: ", { identifier, termValue, pagination });
      return findCurrencyFeeTransactionsBySnapshot(os)(
        termValue,
        pagination,
        identifier
      );
    }),
    TE.fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyBlock = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getBlock(validatedEvent, os)
    )
  );

export const getBlock = (event: APIGatewayEvent, os: Client): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateHashParam),
    map(extractHash),
    map((hash) => ({
      ...hash,
      ...extractCurrencyIdentifier(event),
    })),
    chain(({ hash, currencyIdentifier }) =>
      findBlockByHash(os)(hash, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyTransactions = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getTransactions(validatedEvent, os)
    )
  );

export const getTransactions = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(() =>
      pipe(
        extractPagination(event),
        map((pagination) => {
          return {
            pagination,
            ...extractCurrencyIdentifier(event),
          };
        })
      )
    ),
    chain(({ pagination, currencyIdentifier }) =>
      listTransactions(os)(pagination, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyTransactionsByAddress = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getTransactionsByAddress(validatedEvent, os)
    )
  );

export const getCurrencyFeeTransactionsByAddress = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    TE.Do,
    TE.bind("address", () => extractAddressParam(event)),
    TE.bind("pagination", () => extractPagination(event)),
    TE.bind("identifier", () => extractCurrencyIdentifierParam(event)),
    TE.chain(({ address, pagination, identifier }) =>
      findCurrencyFeeTransactionsByAddress(os)(address, pagination, identifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsByAddress = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateAddressParam),
    map(extractAddress),
    chain(({ address }) =>
      pipe(
        extractPagination(event),
        map((pagination) => {
          return { address, pagination, ...extractCurrencyIdentifier(event) };
        })
      )
    ),
    chain(({ address, pagination, currencyIdentifier }) =>
      findTransactionsByAddress(os)(address, pagination, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyTransactionsBySource = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getTransactionsBySource(validatedEvent, os)
    )
  );

export const getCurrencyFeeTransactionsBySource = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    TE.Do,
    TE.bind("address", () => extractAddressParam(event)),
    TE.bind("pagination", () => extractPagination(event)),
    TE.bind("identifier", () => extractCurrencyIdentifierParam(event)),
    TE.chain(({ address, pagination, identifier }) =>
      findCurrencyFeeTransactionsBySource(os)(address, pagination, identifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsBySource = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateAddressParam),
    map(extractAddress),
    chain(({ address }) =>
      pipe(
        extractPagination(event),
        map((pagination) => ({
          address,
          pagination,
          ...extractCurrencyIdentifier(event),
        }))
      )
    ),
    chain(({ address, pagination, currencyIdentifier }) =>
      findTransactionsBySource(os)(address, pagination, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyTransactionsByDestination = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getTransactionsByDestination(validatedEvent, os)
    )
  );

export const getCurrencyFeeTransactionsByDestination = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    TE.Do,
    TE.bind("address", () => extractAddressParam(event)),
    TE.bind("pagination", () => extractPagination(event)),
    TE.bind("identifier", () => extractCurrencyIdentifierParam(event)),
    TE.chain(({ address, pagination, identifier }) =>
      findCurrencyFeeTransactionsByDestination(os)(
        address,
        pagination,
        identifier
      )
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsByDestination = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateAddressParam),
    map(extractAddress),
    chain(({ address }) =>
      pipe(
        extractPagination(event),
        map((pagination) => ({
          address,
          pagination,
          ...extractCurrencyIdentifier(event),
        }))
      )
    ),
    chain(({ address, pagination, currencyIdentifier }) =>
      findTransactionsByDestination(os)(address, pagination, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyBalanceByAddress = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getBalanceByAddress(validatedEvent, os)
    )
  );

export const getBalanceByAddress = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateAddressParam),
    map(extractAddressAndOrdinal),
    map((params) => ({
      ...params,
      ...extractCurrencyIdentifier(event),
    })),
    chain(({ address, ordinal, currencyIdentifier }) =>
      findBalanceByAddress(os)(address, currencyIdentifier, ordinal)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyTransaction = (event: APIGatewayEvent, os: Client) =>
  pipe(
    extractCurrencyIdentifierParam(event),
    TE.fold(
      (reason) => T.of(errorResponse(reason)),
      (identifier) => getTransaction(event, os, identifier)
    )
  );

export const getCurrencyFeeTransaction = (event: APIGatewayEvent, os: Client) =>
  pipe(
    TE.Do,
    TE.bind("hash", () => extractHashParam(event)),
    TE.bind("identifier", () => extractCurrencyIdentifierParam(event)),
    TE.chain(({ hash, identifier }) =>
      findCurrencyFeeTransactionByHash(os)(hash, identifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getMetagraphs = (event: APIGatewayEvent, os: Client) =>
  pipe(
    TE.Do,
    TE.bind("limit", () => extractLimitParam(event)),
    TE.bind("next", () => extractNextParam(event)),
    TE.chain(({ limit, next }) => listMetagraphs(os)(limit, next)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransaction = (
  event: APIGatewayEvent,
  os: Client,
  currencyIdentifier: string | null
): Task<Response> =>
  pipe(
    extractHashParam(event),
    chain((hash) => findTransactionByHash(os)(hash, currencyIdentifier)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

/** @deprecated use extractCurrencyIdentifierParam  */
const extractCurrencyIdentifier = (
  event: APIGatewayEvent
): { currencyIdentifier: string | null } => {
  return {
    currencyIdentifier: event.pathParameters?.identifier || null,
  };
};

/** @deprecated use extractHashParam  */
const extractHash = (event: APIGatewayEvent) => {
  return { hash: event.pathParameters!.hash! };
};

/** @deprecated use extractAddressParam  */
const extractAddress = (event: APIGatewayEvent) => {
  return { address: event.pathParameters!.address! };
};

/** @deprecated use extractTermParam  */
const extractTerm = (event: APIGatewayEvent) => {
  if (event.pathParameters!.term == "latest")
    return {
      termName: "ordinal",
      termValue: "latest",
    };
  return {
    termName: isNaN(Number(event.pathParameters!.term!)) ? "hash" : "ordinal",
    termValue: event.pathParameters!.term!,
  };
};

/** @deprecated use extractAddressParam and extractOrdinalParam  */
const extractAddressAndOrdinal = (
  event: APIGatewayEvent
): { address: string; ordinal?: number } => {
  const ordinal = Number(event.queryStringParameters?.ordinal);
  return {
    address: event.pathParameters!.address!,
    ...(!isNaN(ordinal) ? { ordinal } : {}),
  };
};

export const extractCurrencyIdentifierParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(getPathParam("identifier"))
  );

export const extractTermParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(getPathParam("term")),
    TE.map((term) => {
      if (term == "latest")
        return {
          termName: "ordinal",
          termValue: "latest",
        };
      return {
        termName: isNaN(Number(term)) ? "hash" : "ordinal",
        termValue: term,
      };
    })
  );

export const extractHashParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(getPathParam("hash"))
  );

export const extractAddressParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain(getPathParam("address"))
  );

export const extractNextParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.map((event) => event.queryStringParameters?.next)
  );

export const extractLimitParam = (event: APIGatewayEvent) =>
  pipe(
    TE.of<ApplicationError, APIGatewayEvent>(event),
    TE.chain((event) => {
      const limitParam = event.queryStringParameters?.limit;
      const limit = Number(limitParam);

      if (limitParam !== undefined && isNaN(limit)) {
        return TE.left(
          new ApplicationError(
            "limit must be a number",
            [],
            StatusCodes.BAD_REQUEST
          )
        );
      }

      return TE.right(limit || undefined);
    })
  );
