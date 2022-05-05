import { Client } from '@opensearch-project/opensearch'
import { APIGatewayEvent } from 'aws-lambda'
import { pipe } from 'fp-ts/lib/pipeable'
import { task } from "fp-ts/lib/Task"
import { chain, fold, map, taskEither } from 'fp-ts/lib/TaskEither'
import { ApplicationError, errorResponse, StatusCodes, successResponse } from './http'
import { getBalanceByAddress, getSnapshot, getSnapshotRewards } from './opensearch'
import { validateAddressesEvent } from './validation'

export const getGlobalSnapshot = (event: APIGatewayEvent, os: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
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
        chain(validateAddressesEvent),
        map(extractTerm),
        chain(({ termName, termValue }) => getSnapshotRewards(os)(termName, termValue)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getBalanceByAddressHandler = (event: APIGatewayEvent, os: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(extractOrdinal),
        chain(({ term, ordinal }) => getBalanceByAddress(os)(term, ordinal)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

const extractOrdinal = (event: APIGatewayEvent) => {
    return {
        term: event.pathParameters!.term,
        ordinal: (event.queryStringParameters && event.queryStringParameters!.ordinal) || undefined
    }
}

const extractTerm = (event: APIGatewayEvent) => {
    if (event.pathParameters!.term == 'latest')
        return {
            termName: 'ordinal',
            termValue: 'latest'
        }
    return {
        termName: isNumber(event.pathParameters!.term) ? 'ordinal' : 'hash',
        termValue: event.pathParameters!.term
    }
}

const isNumber = (term: string): boolean => { return /^\d+$/.test(term) }