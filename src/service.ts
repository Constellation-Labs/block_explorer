import { Client } from "@opensearch-project/opensearch";
import { APIGatewayEvent } from "aws-lambda";
import { pipe } from "fp-ts/lib/pipeable";
import { task } from "fp-ts/lib/Task";
import { chain, fold, map, taskEither } from "fp-ts/lib/TaskEither";
import {
  ApplicationError,
  errorResponse,
  StatusCodes,
  successResponse,
} from "./http";

import {
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
  findTransactionsByAddress,
  findTransactionsByDestination,
  findTransactionsBySource,
} from "./opensearch";

export const getGlobalSnapshot = (event: APIGatewayEvent, os: Client) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(validateSnapshotsEvent),
    map(extractTerm),
    chain(({ termName, termValue }) => findSnapshot(os)(termValue)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getGlobalSnapshotRewards = (event: APIGatewayEvent, os: Client) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(() => findSnapshotRewards(os)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getBlock = (event: APIGatewayEvent, os: Client) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(validateBlocksEvent),
    map(extractHash),
    chain(({ hash }) => findBlockByHash(os)(hash)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
    )
  );
export const getTransactionsByAddress = (event: APIGatewayEvent, os: Client) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) => findTransactionsByAddress(os)(address)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsBySource = (event: APIGatewayEvent, os: Client) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) => findTransactionsBySource(os)(address)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransactionsByDestination = (
  event: APIGatewayEvent,
  os: Client
) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByAddressEvent),
    map(extractAddress),
    chain(({ address }) => findTransactionsByDestination(os)(address)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
    )
  );

export const getTransaction = (event: APIGatewayEvent, os: Client) =>
  pipe(
    taskEither.of<ApplicationError, APIGatewayEvent>(event),
    chain(validateTransactionByHashEvent),
    map(extractHash),
    chain(({ hash }) => findTransactionByHash(os)(hash)),
    fold(
      (reason) => task.of(errorResponse(reason)),
      (value) => task.of(successResponse(StatusCodes.OK)(value))
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
    address: event.pathParameters!.term,
    ordinal: event.queryStringParameters?.ordinal,
  };
};
