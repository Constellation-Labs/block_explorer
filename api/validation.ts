import {APIGatewayEvent} from 'aws-lambda'
import {ApplicationError, StatusCodes} from './http'
import {chain, left, of, right, TaskEither} from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/pipeable'

const bodyNotNull = (event: APIGatewayEvent) => {
    if (event.body === null) {
        return left<ApplicationError, APIGatewayEvent>(
            new ApplicationError(
                'Error parsing request body',
                ['Body cannot be empty'],
                StatusCodes.BAD_REQUEST
            )
        )
    }
    return right<ApplicationError, APIGatewayEvent>(event)
}

const queryParamsIsNull = (event: APIGatewayEvent) => {
    if (event.queryStringParameters !== null) {
        return left<ApplicationError, APIGatewayEvent>(
            new ApplicationError(
                'Error parsing request query params',
                ['Query params should be empty'],
                StatusCodes.BAD_REQUEST
            )
        )
    }
    return right<ApplicationError, APIGatewayEvent>(event)
}

const pathParamsIsNotNull = (event: APIGatewayEvent) => {
    if (event.pathParameters === null) {
        return left<ApplicationError, APIGatewayEvent>(
            new ApplicationError(
                'Error parsing request path params',
                ['Path params should not be empty'],
                StatusCodes.BAD_REQUEST
            )
        )
    }
    return right<ApplicationError, APIGatewayEvent>(event)
}

const termIsNotNull = (event: APIGatewayEvent) => pipe(
    of<ApplicationError, APIGatewayEvent>(event),
    chain(pathParamsIsNotNull),
    chain(() => event.pathParameters!.hash === null
        ? left<ApplicationError, APIGatewayEvent>(
            new ApplicationError(
                'Error parsing request path params',
                ['Term param should not be empty'],
                StatusCodes.BAD_REQUEST))
        : right<ApplicationError, APIGatewayEvent>(event))
)

export const validateListSnapshotsEvent = (event: APIGatewayEvent) =>
    pipe(
        of<ApplicationError, APIGatewayEvent>(event),
        chain(termIsNotNull)
    )

export const validateListCheckpointBlocksEvent = (event: APIGatewayEvent) =>
    pipe(
        of<ApplicationError, APIGatewayEvent>(event),
        chain(termIsNotNull)
    )

export const validateListTransactionsEvent = (event: APIGatewayEvent) =>
    pipe(
        of<ApplicationError, APIGatewayEvent>(event),
        chain(termIsNotNull)
    )