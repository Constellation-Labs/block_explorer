import { ApiResponse, Client } from '@opensearch-project/opensearch'
import { QueryDslNestedQuery, SearchResponse } from '@opensearch-project/opensearch/api/types'
import { TransportRequestPromise } from '@opensearch-project/opensearch/lib/Transport'
import { pipe } from 'fp-ts/lib/pipeable'
import { chain, left, right, TaskEither, tryCatch } from 'fp-ts/lib/TaskEither'
import { ExtractedResult, extractInnerHits, extractOuterHits } from './extract'
import { ApplicationError, StatusCodes } from './http'
import { Balance, BalanceValue, OpenSearchSnapshot, Ordinal, RewardTransaction, Snapshot, WithRewards } from './model'
import { fieldTerm, getByFieldNestedQuery, getLatestQuery, getQuery } from './queries'

enum OSIndex {
    Snapshots = 'snapshots_kris_1'
}

export const getClient = (): Client => {
    return new Client({ node: 'http://localhost:9501' })
}

export const getSnapshot = (os: Client) => (predicateName: string, predicateValue: string = 'latest'): TaskEither<ApplicationError, Snapshot> => {

    const outerIncludes = ['ordinal', 'hash', 'height', 'subHeight', 'timestamp', 'blocks']
    const osSearch = getSnapshotQuery<OpenSearchSnapshot>(predicateName, predicateValue, outerIncludes)(os)

    return pipe(findOuter(osSearch), chain(extractSnapshot))
}

export const getSnapshotRewards = (os: Client) => (predicateName: string, predicateValue: string = 'latest'): TaskEither<ApplicationError, RewardTransaction[]> => {

    const outerIncludes = ['rewards']
    const osSearch = getSnapshotQuery<WithRewards>(predicateName, predicateValue, outerIncludes)(os)

    return pipe(findOuter(osSearch), chain(extractRewards))
}

export const getBalanceByAddress = (os: Client) => (address: string, ordinal: string = 'latest'): TaskEither<ApplicationError, Balance> => {

    const innerPath = 'info.balances'
    const nested = getByFieldNestedQuery(innerPath, 'address', address, ['balance'])
    const osSearch = getSnapshotQuery<Ordinal>('ordinal', ordinal, ['ordinal'], nested)(os)

    return pipe(findInner(innerPath)(osSearch), chain(extractBalance))
}

const getByFieldQuery = <T>(
    index: string,
    field: string,
    value: string,
    includes: string[] = [],
    nestedBody?: QueryDslNestedQuery,
    size: number | null = 1
) => (os: Client) => {
    const fieldQuery = fieldTerm(field, value)
    return os.search<SearchResponse<T>>(getQuery(index, includes, fieldQuery, nestedBody, size))
}

const getLatestOrdinalQuery = <T>(index: string, includes: string[] = [], nestedBody?: QueryDslNestedQuery) => (os: Client) =>
    os.search<SearchResponse<T>>(getLatestQuery(index, nestedBody, includes))

const isLatest = (termName: string, termValue: string): boolean => termName === 'ordinal' && termValue === 'latest'

const getSnapshotQuery = <T>(
    predicateName: string,
    predicateValue: string,
    includes: string[] = [],
    nestedBody?: QueryDslNestedQuery,
    size: number | null = 1
) => (os: Client) => {
    const osSearch = (isLatest(predicateName, predicateValue)
        ? getLatestOrdinalQuery<T>(OSIndex.Snapshots, includes, nestedBody)(os)
        : getByFieldQuery<T>(OSIndex.Snapshots, predicateName, predicateValue, includes, nestedBody, size)(os))

    return osSearch
}

function extractSnapshot(res: OpenSearchSnapshot[]): TaskEither<ApplicationError, Snapshot> {
    if (res.length == 1) {
        const baseSnapshot = res[0]
        const snapshot = { ...baseSnapshot, blocks: baseSnapshot.blocks.map(block => block.hash) }
        return right(snapshot)
    }

    return left(new ApplicationError(
        "Not found",
        ["Malformed data."],
        StatusCodes.NOT_FOUND
    ))
}

function extractRewards(res: WithRewards[]): TaskEither<ApplicationError, RewardTransaction[]> {
    if (res.length == 1) {
        const withRewards = res[0]
        const rewards = withRewards.rewards
        return right(rewards)
    }

    return left(new ApplicationError(
        "Not found",
        ["Malformed data."],
        StatusCodes.NOT_FOUND
    ))
}

function extractBalance(res: ExtractedResult<Ordinal, BalanceValue>[]): TaskEither<ApplicationError, Balance> {
    if (res.length == 1) {
        if (res[0].inner.length == 1) {
            return right(Object.assign(res[0].outer, res[0].inner[0]))
        }
    }

    return left(new ApplicationError(
        "Not found",
        ["Malformed data."],
        StatusCodes.NOT_FOUND
    ))
}

const findOuter = <T>(search: TransportRequestPromise<ApiResponse<SearchResponse<T>>>) => pipe(
    find(search),
    chain(body => extractOuterHits<T>(body))
)

const findInner = <T, U>(innerPath: string) => (search: TransportRequestPromise<ApiResponse<SearchResponse<T>>>) => pipe(
    find(search),
    chain(body => extractInnerHits<T, U>(innerPath, body))
)

const find = <T>(search: TransportRequestPromise<ApiResponse<SearchResponse<T>>>) =>
    tryCatch<ApplicationError, SearchResponse<T>>(
        () => search.then(r => { return r.body }),
        err => new ApplicationError(
            'ElasticSearch error',
            [err as string],
            StatusCodes.SERVER_ERROR
        )
    )