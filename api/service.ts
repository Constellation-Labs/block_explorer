import {Client} from '@elastic/elasticsearch'
import {ApplicationError, errorResponse, StatusCodes, successResponse} from './http'
import {APIGatewayEvent} from 'aws-lambda'
import {chain, fold, taskEither, map} from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/pipeable'
import {getSnapshot} from './elastic'
import {validateListSnapshotsEvent} from './validation'

export const getSnapshotHandler = (event: APIGatewayEvent, es: Client) =>
    pipe(
        taskEither.of<ApplicationError, APIGatewayEvent>(event),
        chain(validateListSnapshotsEvent),
        map(event => event.pathParameters!.term),
        chain(getSnapshot(es)),
        fold(
            reason => taskEither.of(errorResponse(reason)),
            value => taskEither.of(successResponse(StatusCodes.OK)(value))
        )
    )