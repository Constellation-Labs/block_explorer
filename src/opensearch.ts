import { Client } from "@opensearch-project/opensearch";
import { pipe } from "fp-ts/lib/function";

import { ApplicationError, OpenSearchError, StatusCodes } from "./http";
import {
  Balance,
  Block,
  CurrencyData,
  FeeTransaction,
  OpenSearchBalance,
  OpenSearchBlock,
  OpenSearchFeeTransaction,
  OpenSearchSnapshot,
  OpenSearchTransaction,
  RewardTransaction,
  Transaction,
  WithoutRewards,
} from "./model";
import {
  findAll,
  findOne,
  getAll,
  getByFieldQuery,
  getDocumentQuery,
  getLatestQuery,
  getMultiQuery,
  getSearchSince,
  maxSizeLimit,
  SearchDirection,
  SortOption,
  SortOptions,
  SortOptionSince,
  SortOrder,
} from "./query";

import {
  chain,
  left,
  map,
  of,
  orElse,
  right,
  TaskEither,
  tryCatch,
} from "fp-ts/lib/TaskEither";
import { fromNextString, Pagination, toNextString } from "./request-params";
import { Get, Paths } from "./ts-extensions";
import { Metagraph } from "./model/metagraph";
import {
  CurrencySnapshot,
  OpenSearchCurrencySnapshot,
  openSearchCurrencySnapshotToV2,
  OpenSearchCurrencySnapshotV1,
} from "./model/currency-snapshot";

enum OSIndex {
  Snapshots = "snapshots",
  Blocks = "blocks",
  Transactions = "transactions",
  Balances = "balances-*",
  CurrencySnapshots = "currency-snapshots-*",
  CurrencyBlocks = "currency-blocks",
  CurrencyTransactions = "currency-transactions",
  CurrencyFeeTransactions = "currency-fee-transactions",
  CurrencyBalances = "currency-balances-*",
}

export type Result<T> = {
  data: T;
  meta?: {};
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    next: string | null;
  };
};

export const getClient = (): Client => {
  return new Client({ node: process.env.OPENSEARCH_NODE });
};

const getResultWithNextString =
  <T>(sortOptions: SortOptions<T>) =>
  (
    getData: (sortOptions: SortOptions<T>) => TaskEither<ApplicationError, T[]>
  ): TaskEither<ApplicationError, PaginatedResult<T>> => {
    // NOTE: We exceed the limit by 1 additional element to determine if next page is empty
    const plusOneSize = sortOptions.size
      ? sortOptions.size + 1
      : maxSizeLimit + 1;

    return pipe(
      getData({
        ...sortOptions,
        size: plusOneSize,
      }),
      chain((plusOneData) => {
        if (plusOneData.length === 0)
          return left(
            new ApplicationError("Not found", [], StatusCodes.NOT_FOUND)
          );

        if (plusOneData.length < plusOneSize) {
          return right({ data: plusOneData, meta: { next: null } });
        }

        const data = plusOneData.slice(0, -1);
        const element = data[data.length - 1];

        const getValue = <T>(option: SortOption<T> | SortOptionSince<T>) =>
          option.sortField.split(".").reduce((acc, n) => acc[n], element);

        return right<ApplicationError, PaginatedResult<T>>({
          data,
          meta: {
            next: toNextString<T>({
              size: sortOptions.size,
              options: sortOptions.options.map((option) => ({
                ...option,
                searchSince: getValue(option),
              })),
            }),
          },
        });
      })
    );
  };

const getAggregationResultWithNextString =
  <T, S, A>(sortOptions: SortOptions<S>) =>
  (
    getDataWithAfterKey: (
      sortOptions: SortOptions<S>
    ) => TaskEither<ApplicationError, [T[], A]>
  ): TaskEither<ApplicationError, PaginatedResult<T>> => {
    // NOTE: We exceed the limit by 1 additional element to determine if next page is empty
    const plusOneSize = sortOptions.size
      ? sortOptions.size + 1
      : maxSizeLimit + 1;

    return pipe(
      getDataWithAfterKey({
        ...sortOptions,
        size: plusOneSize,
      }),
      chain(([plusOneData, after_key]) => {
        if (plusOneData.length === 0)
          return left(
            new ApplicationError("Not found", [], StatusCodes.NOT_FOUND)
          );

        if (plusOneData.length < plusOneSize) {
          return right({ data: plusOneData, meta: { next: null } });
        }

        const data = plusOneData.slice(0, -1);

        return right<ApplicationError, PaginatedResult<T>>({
          data,
          meta: {
            next: toNextString<S>({
              size: sortOptions.size,
              options: sortOptions.options
                .filter((option) => after_key[option.sortField] !== undefined)
                .map((option) => ({
                  ...option,
                  searchSince: after_key[option.sortField],
                })),
            }),
          },
        });
      })
    );
  };

const getSortOptions = <T, R>(pagination: Pagination<T>) => ({
  withDefault: (def: SortOptions<R>): SortOptions<R> => {
    if ("next" in pagination) {
      const sortOptionsFromNext = fromNextString<R>(pagination.next);
      return {
        ...sortOptionsFromNext,
        size: pagination.size ?? sortOptionsFromNext.size,
      };
    } else {
      return def;
    }
  },
});

export function getFromPath<O, K extends string>(obj: O, path: K): Get<O, K>;
export function getFromPath(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const [firstKey, ...restKeys] = path.split(".");

  if (firstKey === undefined || firstKey === "") {
    return obj;
  }

  const value = obj[firstKey];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (restKeys.length === 0) {
    return value;
  }

  if (typeof value !== "object") {
    return undefined;
  }

  return getFromPath(value as Record<string, unknown>, restKeys.join("."));
}

export const findCollectionByTerm =
  <OSC>(os: Client) =>
  (
    term: OSC[keyof OSC],
    fields: (keyof OSC)[],
    sortOptions: SortOptions<OSC>,
    index: OSIndex,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OSC>> => {
    const stringifyTerm = (term: OSC[keyof OSC]) => {
      return term !== null && term !== undefined && typeof term !== "object"
        ? (String(term) as OSC[keyof OSC])
        : ("" as OSC[keyof OSC]);
    };

    return getResultWithNextString<OSC>(sortOptions)((sort) => {
      const query =
        fields.length === 1
          ? getByFieldQuery<OSC, keyof OSC>(
              index,
              fields[0],
              stringifyTerm(term),
              sort,
              currencyIdentifier
            )
          : getMultiQuery<OSC, keyof OSC>(
              index,
              fields,
              stringifyTerm(term),
              sort,
              currencyIdentifier
            );
      return findAll<OSC>(os.search(query), currencyIdentifier);
    });
  };

export const findSnapshotRewards =
  (os: Client) =>
  (
    term: string,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, Result<RewardTransaction[]>> =>
    pipe(
      findOne<OpenSearchSnapshot>(
        findSnapshotByTerm(os)(term, currencyIdentifier),
        currencyIdentifier
      ),
      map((r) => ({ ...r, data: r.data.rewards }))
    );

export const listMetagraphs =
  (os: Client) =>
  (
    pagination: Pagination<Metagraph>
  ): TaskEither<ApplicationError, PaginatedResult<Metagraph>> => {
    const { size, ...options } = pagination;
    const sortOptions = getSortOptions<
      CurrencyData<OpenSearchCurrencySnapshotV1>,
      Metagraph
    >(pagination).withDefault({
      size,
      options: [
        {
          ...options,
          searchDirection: SearchDirection.Before,
          sortField: "identifier" as Paths<
            CurrencyData<OpenSearchCurrencySnapshotV1>
          >,
        },
      ],
    });

    type LastMetagraphSnapshot = CurrencyData<
      Pick<
        OpenSearchCurrencySnapshotV1,
        "hash" | "ownerAddress" | "stakingAddress"
      >
    >;

    type MetagraphBucket = {
      latestSnapshot: {
        hits: {
          hits: [{ _source: LastMetagraphSnapshot }];
        };
      };
    };

    type MetagraphsAggregation = {
      after_key: {
        identifier:
          | CurrencyData<OpenSearchCurrencySnapshotV1>["identifier"]
          | null;
      };
      buckets: MetagraphBucket[];
    };

    return getAggregationResultWithNextString<
      Metagraph,
      LastMetagraphSnapshot,
      MetagraphsAggregation["after_key"]
    >(sortOptions)((sort) => {
      const after = sortOptions.options
        .filter(isSearchSinceOption)
        .map<SortOptionSince<LastMetagraphSnapshot>>(
          (opt) => opt as SortOptionSince<LastMetagraphSnapshot>
        )
        .reduce(
          (acc, curr) => ({
            ...acc,
            [curr.sortField]: curr.searchSince,
          }),
          {}
        );

      const query = {
        size: 0,
        aggs: {
          metagraphs: {
            composite: {
              sources: [
                {
                  identifier: {
                    terms: {
                      field: "identifier" as Paths<
                        CurrencyData<OpenSearchCurrencySnapshotV1>
                      >,
                    },
                  },
                },
              ],
              size: sort.size,
              ...(Object.keys(after).length > 0 ? { after } : {}),
            },
            aggs: {
              latestSnapshot: {
                top_hits: {
                  sort: [
                    {
                      "data.ordinal": {
                        order: SortOrder.Desc,
                      },
                    } as {
                      [K in Paths<
                        CurrencyData<OpenSearchCurrencySnapshotV1>
                      >]: {
                        order: SortOrder;
                      };
                    } & { [key: string]: never },
                  ],
                  _source: {
                    includes: [
                      "identifier",
                      "data.hash",
                      "data.ownerAddress",
                      "data.stakingAddress",
                    ] as Paths<CurrencyData<OpenSearchCurrencySnapshotV1>>[],
                  },
                  size: 1,
                },
              },
            },
          },
        },
      };

      return pipe(
        tryCatch<ApplicationError, MetagraphsAggregation>(
          () =>
            os
              .search({
                index: OSIndex.CurrencySnapshots,
                body: query,
              })
              .then((r) => r.body.aggregations.metagraphs),
          (err) =>
            new ApplicationError(
              "OpenSearch error",
              [err as string],
              StatusCodes.SERVER_ERROR
            )
        ),
        map(({ buckets, after_key }) => {
          const data = buckets
            .map(({ latestSnapshot }) => latestSnapshot.hits.hits)
            .map(([hit]) => hit._source)
            .map(
              ({
                identifier,
                data: { hash, stakingAddress, ownerAddress },
              }) => ({
                id: identifier,
                lastSnapshotHash: hash,
                stakingAddress: stakingAddress ?? null,
                ownerAddress: ownerAddress ?? null,
              })
            );

          return [data, after_key];
        })
      );
    });
  };

export const listSnapshots =
  <OSS extends OpenSearchSnapshot>(os: Client) =>
  (
    pagination: Pagination<WithoutRewards<OSS>>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OSS>> => {
    const { size, ...options } = pagination;
    const sortOptions = getSortOptions<WithoutRewards<OSS>, OSS>(
      pagination
    ).withDefault({
      size,
      options: [
        {
          ...options,
          searchDirection: options["searchDirection"] || SearchDirection.Before,
          sortField: "ordinal",
        },
      ],
    });

    return getResultWithNextString(sortOptions)((sort) =>
      findAll<OSS>(
        os.search(
          getAll<OSS>(
            currencyIdentifier ? OSIndex.CurrencySnapshots : OSIndex.Snapshots,
            sort,
            currencyIdentifier
          )
        ),
        currencyIdentifier
      )
    );
  };

export const findCurrencySnapshotsByOwnerAddress =
  (os: Client) =>
  (
    ownerAddress: string,
    pagination: Pagination<CurrencySnapshot & { metagraphId: string }>
  ): TaskEither<
    OpenSearchError,
    PaginatedResult<CurrencySnapshot & { metagraphId: string }>
  > => {
    const { size, ...options } = pagination;

    const sortOptions = getSortOptions<any, any>(pagination).withDefault({
      size,
      options: [
        {
          ...options,
          searchDirection: SearchDirection.Before,
          sortField: "data.ordinal",
        },
        {
          ...options,
          searchDirection: SearchDirection.Before,
          sortField: "identifier",
        },
      ],
    });

    return pipe(
      getResultWithNextString<
        CurrencyData<WithoutRewards<OpenSearchCurrencySnapshotV1>>
      >(sortOptions)((sort) => {
        const query = {
          index: OSIndex.CurrencySnapshots,
          body: {
            ...getSearchSince<CurrencyData<OpenSearchCurrencySnapshotV1>>(sort),
            sort: sort.options.map((s) => ({
              [s.sortField]:
                s.searchDirection === SearchDirection.After
                  ? SortOrder.Asc
                  : SortOrder.Desc,
            })),
            size: sort.size || maxSizeLimit,
            _source: {
              excludes: ["data.rewards"] as Paths<
                CurrencyData<OpenSearchCurrencySnapshotV1>
              >[],
            },
            query: {
              bool: {
                must: {
                  term: { ["data.ownerAddress"]: ownerAddress } as Record<
                    Paths<CurrencyData<OpenSearchCurrencySnapshotV1>>,
                    string
                  >,
                },
              },
            },
          },
        };

        return pipe(
          tryCatch<
            OpenSearchError,
            CurrencyData<WithoutRewards<OpenSearchCurrencySnapshot>>[]
          >(
            () =>
              os
                .search(query)
                .then((r) => r.body.hits.hits.map((h) => h._source)),
            (err) => new OpenSearchError(err as string)
          )
        );
      }),
      map(({ data, ...rest }) => ({
        ...rest,
        data: data.map(({ identifier, data }) => ({
          metagraphId: identifier,
          ...openSearchCurrencySnapshotToV2(data),
        })),
      }))
    );
  };

const exportSortOptions = <C, OSC>(
  pagination: Pagination<C>,
  sortFields: Paths<C>[],
  findByHashFallback: () => TaskEither<ApplicationError, Result<C>>
): TaskEither<ApplicationError, SortOptions<OSC>> => {
  const { size, ...options } = pagination;

  return pagination["searchSince"]
    ? (() =>
        pipe(
          findByHashFallback(),
          map((r: Result<C>) => ({
            size,
            options: sortFields.map((sortField) => ({
              sortField,
              searchDirection:
                options["searchDirection"] || SearchDirection.Before,
              searchSince: getFromPath(r.data, sortField),
            })),
          }))
        ))()
    : of(
        getSortOptions<C, OSC>(pagination).withDefault({
          size,
          options: sortFields.map((sortField) => ({
            ...options,
            sortField,
            searchDirection:
              options["searchDirection"] || SearchDirection.Before,
          })),
        })
      );
};

export const listTransactions =
  (os: Client) =>
  (
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    pipe(
      exportSortOptions<Transaction, OpenSearchTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain<
        ApplicationError,
        SortOptions<OpenSearchTransaction>,
        PaginatedResult<OpenSearchTransaction>
      >((sortOptions) =>
        getResultWithNextString<OpenSearchTransaction>(sortOptions)((sort) =>
          findAll<OpenSearchTransaction>(
            os.search(
              getAll<OpenSearchTransaction>(
                currencyIdentifier
                  ? OSIndex.CurrencyTransactions
                  : OSIndex.Transactions,
                sort,
                currencyIdentifier
              )
            ),
            currencyIdentifier
          )
        )
      )
    );

export const findSnapshot =
  <OSS extends OpenSearchSnapshot>(os: Client) =>
  (
    term: string,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, Result<WithoutRewards<OSS>>> => {
    return pipe(
      findOne<OSS>(
        findSnapshotByTerm(os)(term, currencyIdentifier),
        currencyIdentifier
      ),
      map((s) => {
        const { rewards, ...rest } = s.data;
        return { ...s, data: rest };
      })
    );
  };

const findSnapshotByTerm =
  <OSS extends OpenSearchSnapshot>(os: Client) =>
  (term: string, currencyIdentifier: string | null) => {
    const index = currencyIdentifier
      ? OSIndex.CurrencySnapshots
      : OSIndex.Snapshots;

    if (isLatest(term)) {
      return os.search(getLatestQuery<OSS>(index, currencyIdentifier));
    }
    if (isOrdinal(term)) {
      return os.search(
        getByFieldQuery<OSS, "ordinal">(
          index,
          "ordinal",
          term,
          {
            options: [{ sortField: "ordinal" }],
            size: 1,
          },
          currencyIdentifier
        )
      );
    }
    return os.get(getDocumentQuery<OSS>(index, term, currencyIdentifier));
  };

export const findTransactionsBySnapshot =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> => {
    return pipe(
      findSnapshot(os)(term, currencyIdentifier),
      chain((s) =>
        pipe(
          exportSortOptions<Transaction, OpenSearchTransaction>(
            pagination,
            ["snapshotOrdinal", "source", "parent.ordinal"],
            () =>
              findTransactionByHash(os)(
                pagination["searchSince"],
                currencyIdentifier
              )
          ),
          chain((sortOptions) =>
            findCollectionByTerm<OpenSearchTransaction>(os)(
              s.data.ordinal,
              ["snapshotOrdinal"],
              sortOptions,
              currencyIdentifier
                ? OSIndex.CurrencyTransactions
                : OSIndex.Transactions,
              currencyIdentifier
            )
          ),
          orElse((e: ApplicationError) =>
            e.statusCode === StatusCodes.NOT_FOUND
              ? right({ data: [], meta: { next: null } })
              : left(e)
          )
        )
      )
    );
  };

export const findCurrencyFeeTransactionsBySnapshot =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<FeeTransaction>,
    currencyIdentifier: string
  ): TaskEither<
    ApplicationError,
    PaginatedResult<OpenSearchFeeTransaction>
  > => {
    return pipe(
      findSnapshot(os)(term, currencyIdentifier),
      chain((s) => {
        return pipe(
          exportSortOptions<FeeTransaction, OpenSearchFeeTransaction>(
            pagination,
            ["snapshotOrdinal", "source", "parent.ordinal"],
            () =>
              findCurrencyFeeTransactionByHash(os)(
                pagination["searchSince"],
                currencyIdentifier
              )
          ),
          chain((sortOptions) => {
            return findCollectionByTerm<OpenSearchFeeTransaction>(os)(
              s.data.ordinal,
              ["snapshotOrdinal"],
              sortOptions,
              OSIndex.CurrencyFeeTransactions,
              currencyIdentifier
            );
          }),
          orElse((e: ApplicationError) =>
            e.statusCode === StatusCodes.NOT_FOUND
              ? right({ data: [], meta: { next: null } })
              : left(e)
          )
        );
      })
    );
  };

export const findTransactionsByAddress =
  (os: Client) =>
  (
    address: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ) =>
    pipe(
      exportSortOptions<Transaction, OpenSearchTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain((sortOptions) =>
        findCollectionByTerm<OpenSearchTransaction>(os)(
          address,
          ["source", "destination"],
          sortOptions,
          currencyIdentifier
            ? OSIndex.CurrencyTransactions
            : OSIndex.Transactions,
          currencyIdentifier
        )
      )
    );

export const findCurrencyFeeTransactionsByAddress =
  (os: Client) =>
  (
    address: string,
    pagination: Pagination<FeeTransaction>,
    currencyIdentifier: string
  ) =>
    pipe(
      exportSortOptions<FeeTransaction, OpenSearchFeeTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findCurrencyFeeTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain((sortOptions) =>
        findCollectionByTerm<OpenSearchFeeTransaction>(os)(
          address,
          ["source", "destination"],
          sortOptions,
          OSIndex.CurrencyFeeTransactions,
          currencyIdentifier
        )
      )
    );

export const findTransactionsBySource =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    pipe(
      exportSortOptions<Transaction, OpenSearchTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain((sortOptions) =>
        findCollectionByTerm<OpenSearchTransaction>(os)(
          term,
          ["source"],
          sortOptions,
          currencyIdentifier
            ? OSIndex.CurrencyTransactions
            : OSIndex.Transactions,
          currencyIdentifier
        )
      )
    );

export const findCurrencyFeeTransactionsBySource =
  (os: Client) =>
  (
    address: string,
    pagination: Pagination<FeeTransaction>,
    currencyIdentifier: string
  ) =>
    pipe(
      exportSortOptions<FeeTransaction, OpenSearchFeeTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findCurrencyFeeTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain((sortOptions) =>
        findCollectionByTerm<OpenSearchFeeTransaction>(os)(
          address,
          ["source"],
          sortOptions,
          OSIndex.CurrencyFeeTransactions,
          currencyIdentifier
        )
      )
    );

export const findTransactionsByDestination =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    pipe(
      exportSortOptions<Transaction, OpenSearchTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain((sortOptions) =>
        findCollectionByTerm<OpenSearchTransaction>(os)(
          term,
          ["destination"],
          sortOptions,
          currencyIdentifier
            ? OSIndex.CurrencyTransactions
            : OSIndex.Transactions,
          currencyIdentifier
        )
      )
    );

export const findCurrencyFeeTransactionsByDestination =
  (os: Client) =>
  (
    address: string,
    pagination: Pagination<FeeTransaction>,
    currencyIdentifier: string | null
  ) =>
    pipe(
      exportSortOptions<Transaction, OpenSearchTransaction>(
        pagination,
        ["snapshotOrdinal", "source", "parent.ordinal"],
        () =>
          findTransactionByHash(os)(
            pagination["searchSince"],
            currencyIdentifier
          )
      ),
      chain((sortOptions) =>
        findCollectionByTerm<OpenSearchFeeTransaction>(os)(
          address,
          ["destination"],
          sortOptions,
          OSIndex.CurrencyFeeTransactions,
          currencyIdentifier
        )
      )
    );

export const findTransactionByHash =
  (os: Client) =>
  (
    hash: string,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, Result<Transaction>> =>
    pipe(
      findOne<OpenSearchTransaction>(
        os.get(
          getDocumentQuery<OpenSearchTransaction>(
            currencyIdentifier
              ? OSIndex.CurrencyTransactions
              : OSIndex.Transactions,
            hash,
            currencyIdentifier
          )
        ),
        currencyIdentifier
      ),
      map((r) => {
        const { salt, ...tx } = r.data;
        return {
          ...r,
          data: tx,
        };
      })
    );

export const findCurrencyFeeTransactionByHash =
  (os: Client) =>
  (
    hash: string,
    currencyIdentifier: string
  ): TaskEither<ApplicationError, Result<FeeTransaction>> =>
    pipe(
      findOne<OpenSearchFeeTransaction>(
        os.get(
          getDocumentQuery<OpenSearchFeeTransaction>(
            OSIndex.CurrencyFeeTransactions,
            hash,
            currencyIdentifier
          )
        ),
        currencyIdentifier
      )
    );

export const findBalanceByAddress =
  (os: Client) =>
  (
    address: string,
    currencyIdentifier: string | null,
    ordinal?: number
  ): TaskEither<ApplicationError, Result<Balance>> => {
    const sort = {
      options: [
        {
          sortField: "snapshotOrdinal",
          // To achieve (0, ordinal> we need to make (0, ordinal + 1)
          ...(ordinal !== undefined ? { searchSince: ordinal + 1 } : {}),
          searchDirection: SearchDirection.Before,
        },
      ],
      size: 1,
    };

    return pipe(
      findOne<OpenSearchBalance>(
        os.search(
          getByFieldQuery<OpenSearchBalance, "address">(
            currencyIdentifier ? OSIndex.CurrencyBalances : OSIndex.Balances,
            "address",
            address,
            sort,
            currencyIdentifier
          )
        ),
        currencyIdentifier
      ),
      map(({ data: { snapshotOrdinal, balance, address }, meta }) => ({
        data: { ordinal: snapshotOrdinal, balance, address },
        meta,
      })),
      orElse((e: ApplicationError) => {
        return e.statusCode === StatusCodes.NOT_FOUND
          ? pipe(
              findSnapshot(os)("latest", currencyIdentifier),
              map((s) => ({
                data: { ordinal: s.data.ordinal, balance: 0, address },
                meta: {},
              }))
            )
          : left(e);
      })
    );
  };

export const findBlockByHash =
  (os: Client) =>
  (
    hash: string,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, Result<Block>> => {
    return findOne<OpenSearchBlock>(
      os.get(
        getDocumentQuery(
          currencyIdentifier ? OSIndex.CurrencyBlocks : OSIndex.Blocks,
          hash,
          currencyIdentifier
        )
      ),
      currencyIdentifier
    );
  };

const isOrdinal = (term: string | number): term is number =>
  /^\d+$/.test(term.toString());

const isLatest = (
  termValue: string | number | "latest"
): termValue is "latest" => termValue === "latest";

const isSearchSinceOption = <T>(option: any): option is SortOptionSince<T> =>
  "searchSince" in option && option.searchSince !== undefined;
