import { Client } from "@opensearch-project/opensearch";
import { APIGatewayEvent } from "aws-lambda";
import * as T from "fp-ts/lib/Task";
import { chain, fold, map, of } from "fp-ts/lib/TaskEither";
import {
  ApplicationError,
  errorResponse,
  StatusCodes,
  successResponse,
} from "./http";

import {
  validateBalanceByAddressEvent,
  validateBlocksEvent,
  validateSnapshotsEvent,
  validateTransactionByAddressEvent,
  validateTransactionByHashEvent,
} from "./validation";
import {
  findBlockByHash,
  findSnapshot,
  findSnapshotRewards,
  findTransactionByHash,
  findTransactionsByTerm,
  findTransactionsByDestination,
  findTransactionsBySource,
  findTransactionsBySnapshot,
  findTransactionsByAddress,
  findBalanceByAddress,
} from "./opensearch";
import { pipe } from "fp-ts/lib/function";

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
      findTransactionsBySnapshot(os)(termValue)
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
export const getTransactionsByAddress = (event: APIGatewayEvent, os: Client) =>
  pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) => findTransactionsByAddress(os)(address)),
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
    chain(({ address }) => findTransactionsBySource(os)(address)),
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
    chain(({ address }) => findTransactionsByDestination(os)(address)),
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

const extractAddressAndOrdinal = (event: APIGatewayEvent) => {
  return {
    address: event.pathParameters!.address,
    ordinal: Number(event.queryStringParameters?.ordinal),
  };
};
