import {getClient} from './elastic'
import {getSnapshotHandler} from './service'


const toResponse = <A>(body: A) => {
    const client = getClient()

    return {
        statusCode: 200,
        body: JSON.stringify(body)
    }
}

const client = getClient()

export const snapshots = async event => getSnapshotHandler(event, client)()

export const checkpoints = async event => toResponse(["checkpoint1", "checkpoint2"])

export const transactions = async event => toResponse(["transaction1", "transaction2"])
