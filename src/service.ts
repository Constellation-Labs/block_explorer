import {Client} from '@elastic/elasticsearch'
import {ApplicationError, errorResponse, StatusCodes, successResponse} from './http'
import {APIGatewayEvent} from 'aws-lambda'
import {chain, fold, map, taskEither} from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/pipeable'
import {parseISO} from 'date-fns'
import {
    getCheckpointBlock,
    getSnapshot,
    getTransaction,
    getTransactionByAddress,
    getTransactionByReceiver,
    getTransactionBySender,
    getTransactionBySnapshot
} from './elastic'
import {
    validateAddressesEvent,
    validateCheckpointBlocksEvent,
    validateSnapshotsEvent,
    validateTransactionsEvent
} from './validation'
import {task} from "fp-ts/lib/Task";

const extractParameters = (event: APIGatewayEvent) => {
    const searchAfter = event.queryStringParameters && event.queryStringParameters!.search_after

    return {
        term: event.pathParameters!.term,
        limit: (event.queryStringParameters && event.queryStringParameters!.limit && +event.queryStringParameters!.limit) || undefined,
        searchAfter: searchAfter && +parseISO(searchAfter) || +(new Date())
    }
}

export const getSnapshotHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateSnapshotsEvent),
        map(event => event.pathParameters!.term),
        chain(getSnapshot(es)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getCheckpointBlocksHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateCheckpointBlocksEvent),
        map(event => event.pathParameters!.term),
        chain(getCheckpointBlock(es)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateTransactionsEvent),
        map(event => event.pathParameters!.term),
        chain(getTransaction(es)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsBySnapshotHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateTransactionsEvent),
        map(extractParameters),
        chain(({term, limit, searchAfter}) => getTransactionBySnapshot(es)(term, limit, searchAfter)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsByAddressHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(extractParameters),
        chain(({term, limit, searchAfter}) => getTransactionByAddress(es)(term, null, limit, searchAfter)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsBySenderHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(extractParameters),
        chain(({term, limit, searchAfter}) => getTransactionBySender(es)(term, limit, searchAfter)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsByReceiverHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(extractParameters),
        chain(({term, limit, searchAfter}) => getTransactionByReceiver(es)(term, limit, searchAfter)),
        fold(
            reason => task.of(errorResponse(reason)),
            value => task.of(successResponse(StatusCodes.OK)(value))
        )
    )