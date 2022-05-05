import { SearchHit, SearchInnerHitsResult, SearchResponse } from '@opensearch-project/opensearch/api/types'
import { sequence } from 'fp-ts/lib/Array'
import { pipe } from 'fp-ts/lib/function'
import { ApplicativeSeq, chain, left, map, right, TaskEither } from 'fp-ts/lib/TaskEither'
import { ApplicationError, StatusCodes } from './http'

export type ExtractedResult<T, O> = {
    outer: T,
    inner: O[]
}

export function extractOuterHits<T>(response: SearchResponse<T>) {
    return pipe(
        findHits<T>(response.hits.hits),
        map(hits => hits.map(outer => outer._source!)
        ))
}

export function extractInnerHits<T, O>(innerPath: string, response: SearchResponse<T>) {
    return pipe(
        findHits<T>(response.hits.hits),
        chain(hits => sequence(ApplicativeSeq)(hits.map(outer =>
            pipe(
                getInnerHits(innerPath, outer.inner_hits),
                chain(result => findHits<O>(result.hits.hits as SearchHit<O>[])),
                map(inner => createResult<T, O>(outer._source!, inner.map(hit => hit._source!))))
        ))))
}

function createResult<T, O>(outer: T, inner: O[]): ExtractedResult<T, O> {
    return { outer, inner }
}

function getInnerHits(innerPath: string, innerHits?: Record<string, SearchInnerHitsResult>): TaskEither<ApplicationError, SearchInnerHitsResult> {
    return innerHits ? right(innerHits[innerPath]) : notFound()
}

function findHits<T>(hits: SearchHit<T>[]): TaskEither<ApplicationError, SearchHit<T>[]> {
    if (hits.length > 0) {
        return right(hits)
    }

    return notFound()
}

function notFound() {
    return left(
        new ApplicationError(
            "Not found",
            [],
            StatusCodes.NOT_FOUND
        )
    )
}