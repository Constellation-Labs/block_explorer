import {ApiResponse, Client} from '@elastic/elasticsearch'
import {chain, left, right, TaskEither, tryCatch} from 'fp-ts/lib/TaskEither'
import {ApplicationError, StatusCodes} from './http'
import {CheckpointBlock, Snapshot} from './model'
import {pipe} from 'fp-ts/lib/pipeable'
import {TransportRequestPromise} from '@elastic/elasticsearch/lib/Transport'

enum ESIndex {
    Snapshots = 'snapshots',
    CheckpointBlocks = 'checkpoint-blocks',
    Transactions = 'transactions',
    Balances = 'balances'
}

export const getClient = (): Client => {
    return new Client({node: process.env.ELASTIC_SEARCH})
}

const getByHashQuery = (index: string, hash: string) => (es: Client) =>
    es.search({
        index,
        body: {
            size: 1,
            query: {
                match: {
                    hash: {
                        query: hash,
                    },
                }
            }
        }
    })

const getByHeightQuery = (index: string, height: string) => (es: Client) =>
    es.search({
        index,
        body: {
            size: 1,
            query: {
                match: {
                    height: {
                        query: height,
                    },
                }
            }
        }
    })

const getLatestQuery = (index: string) => (es: Client) =>
    es.search({
        index,
        body: {
            size: 1,
            sort: {
                height: {order: "desc"}
            },
            query: {
                match_all: {}
            }
        }
    })

const isLatest = (term: string): boolean => term === 'latest'
const isHeight = (term: string): boolean => /^\d+$/.test(term)

export const getSnapshot = (es: Client) => (term: string): TaskEither<ApplicationError, Snapshot> => {
    const esSearch = (isLatest(term)
        ? getLatestQuery(ESIndex.Snapshots)
        : (isHeight(term) ? getByHeightQuery : getByHashQuery)(ESIndex.Snapshots, term))(es)

    return execute(esSearch)
}

export const getCheckpointBlock = (es: Client) => (term: string): TaskEither<ApplicationError, CheckpointBlock> =>
    execute(getByHashQuery(ESIndex.CheckpointBlocks, term)(es))

const execute = (search: TransportRequestPromise<ApiResponse>) => pipe(
    tryCatch<ApplicationError, any>(
        () => search.then(r => {
            return r.body.hits.hits
        }),
        err => new ApplicationError(
            'ElasticSearch error',
            [err as string],
            StatusCodes.SERVER_ERROR
        )
    ),
    chain(hits => {
        if (hits.length > 0) {
            return right(hits[0]._source)
        }

        return left(
            new ApplicationError(
                "Not found",
                [],
                StatusCodes.NOT_FOUND
            )
        )
    }),
)