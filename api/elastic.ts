import {ApiResponse, Client} from '@elastic/elasticsearch'
import {chain, left, map, right, TaskEither, tryCatch} from 'fp-ts/lib/TaskEither'
import {ApplicationError, StatusCodes} from './http'
import {CheckpointBlock, Snapshot, Sort, SortOrder, Transaction, WithTimestamp} from './model'
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

const getByFieldQuery = <T extends WithTimestamp>(
    index: string,
    field: keyof T,
    value: string,
    size: number = 1,
    sort: Sort<T> = {field: 'timestamp', order: SortOrder.Desc}
) => (es: Client) =>
    es.search({
        index,
        body: {
            size,
            sort: [
                {[sort.field]: sort.order}
            ],
            query: {
                match: {
                    [field]: {
                        query: value,
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
        : getByFieldQuery<Snapshot>(ESIndex.Snapshots, isHeight(term) ? 'height' : 'hash', term))(es)

    return findOne(esSearch)
}

export const getCheckpointBlock = (es: Client) => (term: string): TaskEither<ApplicationError, CheckpointBlock> =>
    findOne(getByFieldQuery<CheckpointBlock>(ESIndex.CheckpointBlocks, 'hash', term)(es))

export const getTransaction = (es: Client) => (term: string): TaskEither<ApplicationError, Transaction> =>
    findOne(getByFieldQuery<Transaction>(ESIndex.Transactions, 'hash', term)(es))

export const getTransactionBySnapshot = (es: Client) => (term: string): TaskEither<ApplicationError, Transaction[]> => {
    if (isHeight(term)) {
        return pipe(
            getSnapshot(es)(term),
            chain(snapshot => getTransactionBySnapshot(es)(snapshot.hash))
        )
    }

    return findAll(getByFieldQuery<Transaction>(ESIndex.Transactions, 'snapshotHash', term, -1)(es))
}

const findOne = (search: TransportRequestPromise<ApiResponse>) =>
    pipe(
        findAll(search),
        map(s => s[0])
    )

const findAll = (search: TransportRequestPromise<ApiResponse>) => pipe(
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
            return right(hits.map(h => h._source))
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