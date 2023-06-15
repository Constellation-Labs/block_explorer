import { Client } from "@opensearch-project/opensearch";
import { pipe } from "fp-ts/lib/function";

import { ApplicationError, StatusCodes } from "./http";
import {
  Balance,
  Block,
  OpenSearchBalance,
  OpenSearchBlock,
  OpenSearchSnapshot,
  OpenSearchTransaction,
  RewardTransaction,
  Snapshot,
  Transaction,
} from "./model";
import {
  findAll,
  findOne,
  getAll,
  getByFieldQuery,
  getDocumentQuery,
  getLatestQuery,
  getMultiQuery,
  maxSizeLimit,
  SearchDirection,
  SortOption,
  SortOptions,
  SortOptionSince,
} from "./query";

import {
  chain,
  left,
  map,
  of,
  orElse,
  right,
  TaskEither,
} from "fp-ts/lib/TaskEither";
import { fromNextString, Pagination, toNextString } from "./validation";

enum OSIndex {
  Snapshots = "snapshots",
  Blocks = "blocks",
  Transactions = "transactions",
  Balances = "balances",
  CurrencySnapshots = "currency-snapshots",
  CurrencyBlocks = "currency-blocks",
  CurrencyTransactions = "currency-transactions",
  CurrencyBalances = "currency-balances",
}

export type Result<T> = {
  data: T;
  meta?: {};
};

export type PaginatedResult<T> = {
  data: T[];
  meta?: {
    next: string;
  };
};

export const getClient = (): Client => {
  return new Client({ node: process.env.OPENSEARCH_NODE });
};

const getResultWithNextString = <T>(
  data: T[],
  sortOptions: SortOptions<T>
): TaskEither<ApplicationError, PaginatedResult<T>> => {
  if (data.length === 0)
    return left(new ApplicationError("Not found", [], StatusCodes.NOT_FOUND));

  if (data.length < (sortOptions.size || maxSizeLimit)) return right({ data });

  const element = data[data.length - 1];

  const getValue = <T>(option: SortOption<T> | SortOptionSince<T>) =>
    option.sortField.split(".").reduce((acc, n) => acc[n], element);

  return right<ApplicationError, PaginatedResult<T>>({
    data,
    meta: {
      next: toNextString<T>({
        size: sortOptions.size,
        options: sortOptions.options.map((option) => {
          return { ...option, searchSince: getValue(option) };
        }),
      }),
    },
  });
};

const getSortOptions = <T, R>(pagination: Pagination<T>) => ({
  withDefault: (def: SortOptions<R>): SortOptions<R> =>
    "next" in pagination ? fromNextString<R>(pagination.next) : def,
});

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

export const listSnapshots =
  (os: Client) =>
  (
    pagination: Pagination<Snapshot>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchSnapshot>> => {
    const { size, ...options } = pagination;
    const sortOptions = getSortOptions<Snapshot, OpenSearchSnapshot>(
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

    return pipe(
      findAll<OpenSearchSnapshot>(
        os.search(
          getAll<OpenSearchSnapshot>(
            currencyIdentifier ? OSIndex.CurrencySnapshots : OSIndex.Snapshots,
            sortOptions,
            currencyIdentifier
          )
        ),
        currencyIdentifier
      ),
      chain((a) => getResultWithNextString(a, sortOptions))
    );
  };

const exportTransactionSortOptions =
  (os: Client) =>
  (
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, SortOptions<OpenSearchTransaction>> => {
    const { size, ...options } = pagination;

    return pagination["searchSince"]
      ? (() => {
          return pipe(
            findTransactionByHash(os)(
              pagination["searchSince"],
              currencyIdentifier
            ),
            map((r: Result<Transaction>) => ({
              size,
              options: [
                {
                  sortField: "snapshotOrdinal",
                  searchDirection:
                    options["searchDirection"] || SearchDirection.Before,
                  searchSince: r.data.snapshotOrdinal,
                },
                {
                  sortField: "source",
                  searchDirection:
                    options["searchDirection"] || SearchDirection.Before,
                  searchSince: r.data.source,
                },
                {
                  sortField: "parent.ordinal",
                  searchDirection:
                    options["searchDirection"] || SearchDirection.Before,
                  searchSince: r.data.parent.ordinal,
                },
              ],
            }))
          );
        })()
      : of(
          getSortOptions<Transaction, OpenSearchTransaction>(
            pagination
          ).withDefault({
            size,
            options: [
              {
                ...options,
                sortField: "snapshotOrdinal",
                searchDirection:
                  options["searchDirection"] || SearchDirection.Before,
              },
              {
                ...options,
                sortField: "source",
                searchDirection:
                  options["searchDirection"] || SearchDirection.Before,
              },
              {
                ...options,
                sortField: "parent.ordinal",
                searchDirection:
                  options["searchDirection"] || SearchDirection.Before,
              },
            ],
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
      exportTransactionSortOptions(os)(pagination, currencyIdentifier),
      chain<
        ApplicationError,
        SortOptions<OpenSearchTransaction>,
        PaginatedResult<OpenSearchTransaction>
      >((sortOptions) =>
        pipe(
          findAll<OpenSearchTransaction>(
            os.search(
              getAll<OpenSearchTransaction>(
                currencyIdentifier
                  ? OSIndex.CurrencyTransactions
                  : OSIndex.Transactions,
                sortOptions,
                currencyIdentifier
              )
            ),
            currencyIdentifier
          ),
          chain((a) =>
            getResultWithNextString<OpenSearchTransaction>(a, sortOptions)
          )
        )
      )
    );

export const findSnapshot =
  (os: Client) =>
  (
    term: string,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, Result<Snapshot>> => {
    return pipe(
      findOne<OpenSearchSnapshot>(
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
  (os: Client) => (term: string, currencyIdentifier: string | null) => {
    const index = currencyIdentifier
      ? OSIndex.CurrencySnapshots
      : OSIndex.Snapshots;

    if (isLatest(term)) {
      return os.search(
        getLatestQuery<OpenSearchSnapshot>(index, currencyIdentifier)
      );
    }
    if (isOrdinal(term)) {
      return os.search(
        getByFieldQuery<OpenSearchSnapshot, "ordinal">(
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
    return os.get(
      getDocumentQuery<OpenSearchSnapshot>(index, term, currencyIdentifier)
    );
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
          findTransactionsByTerm(os)(
            s.data.ordinal,
            ["snapshotOrdinal"],
            pagination,
            currencyIdentifier
          ),
          orElse((e: ApplicationError) =>
            e.statusCode === StatusCodes.NOT_FOUND
              ? right({ data: [] })
              : left(e)
          )
        )
      )
    );
  };

export const findTransactionsByAddress =
  (os: Client) =>
  (
    address: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ) =>
    findTransactionsByTerm(os)(
      address,
      ["source", "destination"],
      pagination,
      currencyIdentifier
    );

export const findTransactionsByTerm =
  (os: Client) =>
  (
    term: string | number,
    fields: (keyof OpenSearchTransaction)[],
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    pipe(
      exportTransactionSortOptions(os)(pagination, currencyIdentifier),
      chain<
        ApplicationError,
        SortOptions<OpenSearchTransaction>,
        PaginatedResult<OpenSearchTransaction>
      >((sortOptions) => {
        const index = currencyIdentifier
          ? OSIndex.CurrencyTransactions
          : OSIndex.Transactions;

        const query =
          fields.length === 1
            ? getByFieldQuery<
                OpenSearchTransaction,
                keyof OpenSearchTransaction
              >(
                index,
                fields[0],
                term.toString(),
                sortOptions,
                currencyIdentifier
              )
            : getMultiQuery<OpenSearchTransaction, keyof OpenSearchTransaction>(
                index,
                fields,
                term.toString(),
                sortOptions,
                currencyIdentifier
              );

        return pipe(
          findAll<OpenSearchTransaction>(os.search(query), currencyIdentifier),
          chain((a) => getResultWithNextString(a, sortOptions))
        );
      })
    );

export const findTransactionsBySource =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    findTransactionsByTerm(os)(
      term,
      ["source"],
      pagination,
      currencyIdentifier
    );

export const findTransactionsByDestination =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>,
    currencyIdentifier: string | null
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    findTransactionsByTerm(os)(
      term,
      ["destination"],
      pagination,
      currencyIdentifier
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

const serverError = () =>
  new ApplicationError(
    "Server Error",
    ["Malformed data."],
    StatusCodes.SERVER_ERROR
  );
