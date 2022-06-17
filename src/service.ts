import { Client } from '@opensearch-project/opensearch';
import { APIGatewayEvent } from 'aws-lambda';
import * as T from 'fp-ts/lib/Task';
import { chain, fold, map, of } from 'fp-ts/lib/TaskEither';
import { ApplicationError, errorResponse, StatusCodes, successResponse, } from './http';

import {
  extractPagination,
  validateBalanceByAddressEvent,
  validateBlocksEvent,
  validateSnapshotsEvent,
  validateTransactionByAddressEvent,
  validateTransactionByHashEvent,
} from './validation';
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
} from './opensearch';
import { pipe } from 'fp-ts/lib/function';
import { Snapshot, Transaction } from './model';

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
    chain(({ pagination }) =>
      listSnapshots(os)(pagination)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshot = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateSnapshotsEvent),
    map(extractTerm),
    chain(({ termName, termValue }) => findSnapshot(os)(termValue)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshotRewards = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(() => findSnapshotRewards(os)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshotTransactions = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateSnapshotsEvent),
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

export const getBlock = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateBlocksEvent),
    map(extractHash),
    chain(({ hash }) => findBlockByHash(os)(hash)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactions = (event: APIGatewayEvent, os: Client) =>
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
    chain(({ pagination }) =>
      listTransactions(os)(pagination)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsByAddress = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) =>
      pipe(
        extractPagination<Transaction>(event),
        map((pagination) => {
          return { address, pagination };
        })
      )
    ),
    chain(({ address, pagination }) =>
      findTransactionsByAddress(os)(address, pagination)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsBySource = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) =>
      pipe(
        extractPagination<Transaction>(event),
        map((pagination) => {
          console.log('pagination!', pagination);
          return { address, pagination };
        })
      )
    ),
    chain(({ address, pagination }) =>
      findTransactionsBySource(os)(address, pagination)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsByDestination = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) =>
      pipe(
        extractPagination<Transaction>(event),
        map((pagination) => ({ address, pagination }))
      )
    ),
    chain(({ address, pagination }) =>
      findTransactionsByDestination(os)(address, pagination)
    ),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getBalanceByAddress = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateBalanceByAddressEvent),
    map(extractAddressAndOrdinal),
    chain(({ address, ordinal }) => findBalanceByAddress(os)(address, ordinal)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransaction = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByHashEvent),
    map(extractHash),
    chain(({ hash }) => findTransactionByHash(os)(hash)),
    fold(
      (reason) => T.of(errorResponse(reason)),
      (value) => T.of(successResponse(StatusCodes.OK)(value))
    )
  );

const extractHash = (event: APIGatewayEvent) => {
  return { hash: event.pathParameters!.hash };
};

const extractAddress = (event: APIGatewayEvent) => {
  return { address: event.pathParameters!.address };
};

const extractTerm = (event: APIGatewayEvent) => {
  if (event.pathParameters!.term == 'latest')
    return {
      termName: 'ordinal',
      termValue: 'latest',
    };
  return {
    termName: isNaN(Number(event.pathParameters!.term)) ? 'hash' : 'ordinal',
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
