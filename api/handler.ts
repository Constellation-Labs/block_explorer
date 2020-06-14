const toResponse = <A>(body: A) => ({
    statusCode: 200,
    body: JSON.stringify(body)
})

export const snapshots = async event => toResponse(["snapshot1", "snapshot2"] )

export const checkpoints = async event => toResponse(["checkpoint1", "checkpoint2"] )

export const transactions = async event => toResponse(["transaction1", "transaction2"] )
