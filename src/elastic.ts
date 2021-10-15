import {ApiResponse, Client} from '@elastic/elasticsearch'
import {chain, fold, left, right, TaskEither, tryCatch} from 'fp-ts/lib/TaskEither'
import {ApplicationError, StatusCodes} from './http'
import {CheckpointBlock, Snapshot, SortOrder, Transaction, WithTimestamp} from './model'
import {pipe} from 'fp-ts/lib/pipeable'
import {TransportRequestPromise} from '@elastic/elasticsearch/lib/Transport'
import {task, taskEither} from "fp-ts";

enum ESIndex {
    Snapshots = 'snapshots',
    CheckpointBlocks = 'checkpoint-blocks',
    Transactions = 'transactions',
    Balances = 'balances'
}

const maxSizeLimit = 10000
const sortField = 'timestamp'

export const getClient = (): Client => {
    return new Client({node: process.env.ELASTIC_SEARCH})
}

const getDocumentQuery = <T extends WithTimestamp>(
    index: string,
    value: string,
) => (es: Client) =>
    es.get({
        index,
        id: value
    })

const getByFieldQuery = <T extends WithTimestamp>(
    index: string,
    field: keyof T,
    value: string,
    size: number | null = 1,
    searchAfter: number | null = +(new Date()),
    order: SortOrder = SortOrder.Desc // TODO: searchAfter and order must be bounded (Desc -> current timestamp, Asc -> 0)
) => (es: Client) =>
    field === 'hash'
        ? getDocumentQuery(index, value)(es)
        : es.search({
            index,
            body: {
                size,
                sort: {[sortField]: order},
                search_after: [searchAfter],
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
    size: number | null = 1,
    searchAfter: number | null = +(new Date()),
    order: SortOrder = SortOrder.Desc
) => (es: Client) =>
    es.search({
        index,
        body: {
            size,
            sort: {[sortField]: order},
            search_after: [searchAfter],
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

export const getCheckpointBlock = (es: Client) => (term: string): TaskEither<ApplicationError, CheckpointBlock> => {
    return pipe(
        findOne(getByFieldQuery<CheckpointBlock>(ESIndex.CheckpointBlocks, 'soeHash', term)(es)),
        fold(
            reason => findOne(getByFieldQuery<CheckpointBlock>(ESIndex.CheckpointBlocks, 'hash', term)(es)),
            value => taskEither.of(value)
        )
    )
}

export const getTransaction = (es: Client) => (term: string): TaskEither<ApplicationError, Transaction> =>
    findOne(getByFieldQuery<Transaction>(ESIndex.Transactions, 'hash', term)(es))

export const getTransactionBySnapshot = (es: Client) => (term: string, limit: number = maxSizeLimit, searchAfter: number = 0): TaskEither<ApplicationError, Transaction[]> => {
    if (isHeight(term) || isLatest(term)) {
        return pipe(
            getSnapshot(es)(term),
            chain(snapshot => getTransactionBySnapshot(es)(snapshot.hash, limit, searchAfter))
        )
    }

    return findAll(getByFieldQuery<Transaction>(ESIndex.Transactions, 'snapshotHash', term, limit, searchAfter)(es))
}

export const getTransactionByAddress = (es: Client) => (term: string, field: 'receiver.keyword' | 'sender.keyword' | null = null, limit: number = maxSizeLimit, searchAfter: number = 0): TaskEither<ApplicationError, Transaction[]> => {
    if (!field) {
        return findAll(getMultiQuery<Transaction>(ESIndex.Transactions, ['receiver.keyword', 'sender.keyword'], term, limit, searchAfter)(es))
    }

    return findAll(getByFieldQuery<Transaction>(ESIndex.Transactions, field, term, limit, searchAfter)(es))
}

export const getTransactionBySender = (es: Client) => (term: string, limit: number = maxSizeLimit, searchAfter: number = 0): TaskEither<ApplicationError, Transaction[]> =>
    getTransactionByAddress(es)(term, 'sender.keyword', limit, searchAfter)

export const getTransactionByReceiver = (es: Client) => (term: string, limit: number = maxSizeLimit, searchAfter: number = 0): TaskEither<ApplicationError, Transaction[]> =>
    getTransactionByAddress(es)(term, 'receiver.keyword', limit, searchAfter)

const findOne = (search: TransportRequestPromise<ApiResponse>) => pipe(
    tryCatch<ApplicationError, any>(
        () => search.then(r =>
            r.body.found
                ? [r.body]
                : r.body.hits.hits
        ),
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