import {getClient} from './elastic'
import {getSnapshotHandler, getCheckpointBlocksHandler} from './service'


const toResponse = <A>(body: A) => {
    return {
        statusCode: 200,
        body: JSON.stringify(body)
    }
}

const client = getClient()

export const snapshots = async event => getSnapshotHandler(event, client)()
export const checkpointBlocks = async event => getCheckpointBlocksHandler(event, client)()
export const transactions = async event => toResponse(["transaction1", "transaction2"])
