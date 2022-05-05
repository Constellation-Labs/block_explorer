import { QueryDslNestedQuery, QueryDslQueryContainer } from "@opensearch-project/opensearch/api/types"

export const getQuery = (
    index: string,
    includes: string[] = [],
    query?: QueryDslQueryContainer,
    nestedQuery?: QueryDslNestedQuery,
    size: number | null = 1) => {
    const filters = nestedQuery ? [query, { nested: nestedQuery }] : [query]
    return {
        index,
        body: {
            size,
            query: {
                bool: {
                    filter: filters
                }
            },
            _source: {
                includes: includes
            }
        }
    }
}

export const getLatestQuery = (index: string, nestedQuery?: QueryDslNestedQuery, includes: string[] = []) => {
    const matchAll = { match_all: {} }
    const filters = nestedQuery ? [matchAll, { nested: nestedQuery }] : [matchAll]
    return {
        index,
        body: {
            size: 1,
            sort: {
                ordinal: { order: "desc" }
            },
            query: {
                bool: {
                    filter: filters
                }
            },
            _source: {
                includes: includes
            }
        }
    }
}

export const getByFieldNestedQuery = (
    path: string,
    term: string,
    value: string,
    includes: string[]
): QueryDslNestedQuery => {
    const query = {
        bool: {
            filter: fieldTerm(path + '.' + term, value)
        }
    }
    return getNestedQuery(path, includes, query)
}

export const getMatchAllNestedQuery = (
    path: string,
    includes: string[]
): QueryDslNestedQuery => {
    const query = { match_all: {} }
    return getNestedQuery(path, includes, query)
}

export const fieldTerm = (fieldName: string, fieldValue: string): QueryDslQueryContainer => {
    return { term: { [fieldName]: { value: fieldValue } } }
}

const getNestedQuery = (path: string, includes: string[], query: QueryDslQueryContainer): QueryDslNestedQuery => {
    return {
        path: path,
        query: query,
        ignore_unmapped: false,
        inner_hits: {
            ignore_unmapped: false,
            from: 0,
            size: 7,
            version: false,
            seq_no_primary_term: false,
            explain: false,
            _source: {
                includes: includes.map(name => path + '.' + name)
            }
        }
    }
}