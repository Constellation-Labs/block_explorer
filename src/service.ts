import { Client } from "@opensearch-project/opensearch";
import { APIGatewayEvent } from "aws-lambda";
import * as T from "fp-ts/lib/Task";
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
} from "./validation";
import {
  findBalanceByAddress,
  findBlockByHash,
  findSnapshot,
  findSnapshotRewards,
  findTransactionByHash,
  findTransactionsByAddress,
  findTransactionsByDestination,
  findTransactionsBySnapshot,
  findTransactionsBySource,
  listSnapshots,
  listTransactions,
} from "./opensearch";
import { pipe } from "fp-ts/lib/function";
import { Snapshot, Transaction } from "./model";

export const getCurrencySnapshots = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    chain(() =>
      pipe(
        extractPagination<Snapshot>(event),
        map((pagination) => {
          return { pagination, ...extractCurrencyIdentifier(event) };
        })
      )
    ),
    chain(({ pagination, currencyIdentifier }) =>
      listSnapshots(os)(pagination, currencyIdentifier)
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
        extractPagination<Snapshot>(event),
        map((pagination) => {
          return { pagination };
        })
      )
    ),
    chain(({ pagination }) => listSnapshots(os)(pagination)),
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
    chain(({ termName, termValue }) => findSnapshot(os)(termValue)),
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
      findSnapshot(os)(termValue, currencyIdentifier)
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
    chain(({ termName, termValue }) => findSnapshotRewards(os)(termValue)),
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
        extractPagination<Transaction>(event),
        map((pagination) => ({ termName, termValue, pagination }))
      )
    ),
    chain(({ termName, termValue, pagination }) =>
      findTransactionsBySnapshot(os)(termValue, pagination)
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
        extractPagination<Transaction>(event),
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
        extractPagination<Snapshot>(event),
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
        extractPagination<Transaction>(event),
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
    // chain((validatedEvent) =>
    //   TE.fromTask(getTransactionsBySource(validatedEvent, os))
    // )
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
        extractPagination<Transaction>(event),
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
        extractPagination<Transaction>(event),
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
      findBalanceByAddress(os)(address, ordinal, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getCurrencyTransaction = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateCurrencyIdentifierParam),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (validatedEvent) => getTransaction(validatedEvent, os)
    )
  );

export const getTransaction = (
  event: APIGatewayEvent,
  os: Client
): Task<Response> =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateHashParam),
    map(extractHash),
    map((hash) => ({
      ...hash,
      ...extractCurrencyIdentifier(event),
    })),
    chain(({ hash, currencyIdentifier }) =>
      findTransactionByHash(os)(hash, currencyIdentifier)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

const extractCurrencyIdentifier = (
  event: APIGatewayEvent
): Partial<{ currencyIdentifier?: string }> => {
  return {
    currencyIdentifier: event.pathParameters?.identifier,
  };
};

const extractHash = (event: APIGatewayEvent) => {
  return { hash: event.pathParameters!.hash };
};

const extractAddress = (event: APIGatewayEvent) => {
  return { address: event.pathParameters!.address };
};

const extractTerm = (event: APIGatewayEvent) => {
  if (event.pathParameters!.term == "latest")
    return {
      termName: "ordinal",
      termValue: "latest",
    };
  return {
    termName: isNaN(Number(event.pathParameters!.term)) ? "hash" : "ordinal",
    termValue: event.pathParameters!.term,
  };
};

const extractAddressAndOrdinal = (
  event: APIGatewayEvent
): { address: string; ordinal?: number } => {
  const ordinal = Number(event.queryStringParameters?.ordinal);
  return {
    address: event.pathParameters!.address,
    ...(!isNaN(ordinal) ? { ordinal } : {}),
  };
};
