import { Client } from '@opensearch-project/opensearch'
import { APIGatewayEvent } from 'aws-lambda'
import { pipe } from 'fp-ts/lib/pipeable'
import { task } from "fp-ts/lib/Task"
import { chain, fold, map, taskEither } from 'fp-ts/lib/TaskEither'
import { ApplicationError, errorResponse, StatusCodes, successResponse } from './http'
import { getBalanceByAddress, getBlockByHash, getSnapshot, getSnapshotRewards } from './opensearch'
import { validateAddressesEvent, validateBlocksEvent, validateSnapshotsEvent } from './validation'

export const getGlobalSnapshot = (event: APIGatewayEvent, os: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateSnapshotsEvent),
        map(extractTerm),
        chain(({ termName, termValue }) => getSnapshot(os)(termName, termValue)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getGlobalSnapshotRewards = (event: APIGatewayEvent, os: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateSnapshotsEvent),
        map(extractTerm),
        chain(({ termName, termValue }) => getSnapshotRewards(os)(termName, termValue)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getBlock = (event: APIGatewayEvent, os: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateBlocksEvent),
        map(extractHash),
        chain(({ hash }) => getBlockByHash(os)(hash)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getBalanceByAddressHandler = (event: APIGatewayEvent, os: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(extractAddressAndOrdinal),
        chain(({ address, ordinal }) => getBalanceByAddress(os)(address, ordinal)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

const extractHash = (event: APIGatewayEvent) => {
    return { hash: event.pathParameters!.hash }
}

const extractTerm = (event: APIGatewayEvent) => {
    if (event.pathParameters!.term == 'latest')
        return {
            termName: 'ordinal',
            termValue: 'latest'
        }
    return {
        termName: isNaN(Number(event.pathParameters!.term)) ? 'hash' : 'ordinal',
        termValue: event.pathParameters!.term
    }
}

const extractAddressAndOrdinal = (event: APIGatewayEvent) => {
    return {
        address: event.pathParameters!.term,
        ordinal: event.queryStringParameters?.ordinal
    }
}