import {ApiResponse, Client} from '@elastic/elasticsearch'
import {chain, left, right, TaskEither, tryCatch} from 'fp-ts/lib/TaskEither'
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
    sort: Sort<T>[] = [{field: 'timestamp', order: SortOrder.Desc}]
) => (es: Client) =>
    es.search({
        index,
        body: {
            size,
            sort: sort.map(s => ({ [s.field]: s.order })),
            query: {
                match: {
                    [field]: {
                        query: value,
                    },
                }
            }
        }
    })

const getMultiQuery = <T extends WithTimestamp>(
    index: string,
    fields: (keyof T)[],
    value: string,
    size: number = 1,
    sort: Sort<T>[] = [{field: 'timestamp', order: SortOrder.Desc}]
) => (es: Client) =>
    es.search({
        index,
        body: {
            size,
            sort: sort.map(s => ({ [s.field]: s.order })),
            query: {
                multi_match: {
                    query: value,
                    fields
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

export const getTransactionByAddress = (es: Client) => (term: string, field: 'receiver' | 'sender' | null = null): TaskEither<ApplicationError, Transaction[]> => {
    const sortByTimestamp: Sort<Transaction> = { field: 'timestamp', order: SortOrder.Desc }
    const sortByOrdinal: Sort<Transaction> = { field: 'lastTransactionRef.ordinal', order: SortOrder.Desc }

    if (!field) {
        return findAll(getMultiQuery<Transaction>(ESIndex.Transactions, ['receiver', 'sender'], term, -1, [sortByTimestamp, sortByOrdinal])(es))
    }

    return findAll(getByFieldQuery<Transaction>(ESIndex.Transactions, field, term, -1, [sortByOrdinal])(es))
}

export const getTransactionBySender = (es: Client) => (term: string): TaskEither<ApplicationError, Transaction[]> =>
    getTransactionByAddress(es)(term, 'sender')

export const getTransactionByReceiver = (es: Client) => (term: string): TaskEither<ApplicationError, Transaction[]> =>
    getTransactionByAddress(es)(term, 'receiver')

const findOne = (search: TransportRequestPromise<ApiResponse>) => pipe(
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
    chain(hits => right(hits.map(h => h._source))),
)