import {Client} from '@elastic/elasticsearch'
import {snapshots} from './handler'
import {chain, left, right, TaskEither, tryCatch} from 'fp-ts/lib/TaskEither'
import {ApplicationError, StatusCodes} from './http'
import {Snapshot} from './model'
import {pipe} from 'fp-ts/lib/pipeable'

export const getClient = (): Client => {
    return new Client({node: process.env.ELASTIC_SEARCH})
}

const getByHash = (index: string, hash: string) => (es: Client) =>
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


const getByHeight = (index: string, height: string) => (es: Client) =>
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


const getLatest = (index: string) => (es: Client) =>
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
    const index = 'snapshots'

    const esSearch = (isLatest(term)
        ? getLatest(index)
        : (isHeight(term) ? getByHeight : getByHash)(index, term))(es)

    return pipe(
        tryCatch<ApplicationError, any>(
            () => esSearch.then(r => {
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
                    "Hash not found",
                    [],
                    StatusCodes.NOT_FOUND
                )
            )
        }),
    )
}