import {Client} from '@elastic/elasticsearch'
import {ApplicationError, errorResponse, StatusCodes, successResponse} from './http'
import {APIGatewayEvent} from 'aws-lambda'
import {chain, fold, map, taskEither} from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/pipeable'
import {
    getCheckpointBlock,
    getSnapshot,
    getTransaction,
    getTransactionByAddress,
    getTransactionByReceiver,
    getTransactionBySender,
    getTransactionBySnapshot
} from './elastic'
import {validateAddressesEvent, validateCheckpointBlocksEvent, validateSnapshotsEvent, validateTransactionsEvent} from './validation'

export const getSnapshotHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateSnapshotsEvent),
        map(event => event.pathParameters!.term),
        chain(getSnapshot(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getCheckpointBlocksHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateCheckpointBlocksEvent),
        map(event => event.pathParameters!.term),
        chain(getCheckpointBlock(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateTransactionsEvent),
        map(event => event.pathParameters!.term),
        chain(getTransaction(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsBySnapshotHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateTransactionsEvent),
        map(event => event.pathParameters!.term),
        chain(getTransactionBySnapshot(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsByAddressHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(event => event.pathParameters!.term),
        chain(getTransactionByAddress(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsBySenderHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(event => event.pathParameters!.term),
        chain(getTransactionBySender(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )

export const getTransactionsByReceiverHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateAddressesEvent),
        map(event => event.pathParameters!.term),
        chain(getTransactionByReceiver(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )