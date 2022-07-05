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
import { Lens } from "monocle-ts";

enum OSIndex {
  Snapshots = "snapshots",
  Blocks = "blocks",
  Transactions = "transactions",
  Balances = "balances",
}

export type Result<T> = {
  data: T;
  meta?: {};
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
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

  const element =
    sortOptions.options[0]?.searchDirection === SearchDirection.Before
      ? data[0]
      : data[data.length - 1];

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

export const findSnapshotRewards = (
  os: Client
): TaskEither<ApplicationError, Result<RewardTransaction[]>> =>
  pipe(
    findOne<OpenSearchSnapshot>(
      os.search(getLatestQuery<OpenSearchSnapshot>(OSIndex.Snapshots))
    ),
    map((r) => ({ ...r, data: r.data.rewards }))
  );

export const listSnapshots =
  (os: Client) =>
  (
    pagination: Pagination<Snapshot>
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
        os.search(getAll<OpenSearchSnapshot>(OSIndex.Snapshots, sortOptions))
      ),
      chain((a) => getResultWithNextString(a, sortOptions))
    );
  };

const exportTransactionSortOptions =
  (os: Client) =>
  (
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, SortOptions<OpenSearchTransaction>> => {
    const { size, ...options } = pagination;

    return pagination["searchSince"]
      ? (() => {
          return pipe(
            findTransactionByHash(os)(pagination["searchSince"]),
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
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    pipe(
      exportTransactionSortOptions(os)(pagination),
      chain<
        ApplicationError,
        SortOptions<OpenSearchTransaction>,
        PaginatedResult<OpenSearchTransaction>
      >((sortOptions) =>
        pipe(
          findAll<OpenSearchTransaction>(
            os.search(
              getAll<OpenSearchTransaction>(OSIndex.Transactions, sortOptions)
            )
          ),
          chain((a) =>
            getResultWithNextString<OpenSearchTransaction>(a, sortOptions)
          )
        )
      )
    );

export const findSnapshot =
  (os: Client) =>
  (term: string): TaskEither<ApplicationError, Result<Snapshot>> => {
    const find = () => {
      if (isLatest(term)) {
        return os.search(getLatestQuery<OpenSearchSnapshot>(OSIndex.Snapshots));
      }
      if (isOrdinal(term)) {
        return os.search(
          getByFieldQuery<OpenSearchSnapshot, "ordinal">(
            OSIndex.Snapshots,
            "ordinal",
            term,
            {
              options: [{ sortField: "ordinal" }],
              size: 1,
            }
          )
        );
      }
      return os.get(
        getDocumentQuery<OpenSearchSnapshot>(OSIndex.Snapshots, term)
      );
    };

    return pipe(
      findOne<OpenSearchSnapshot>(find()),
      map((s) => {
        const { rewards, ...rest } = s.data;
        return {
          ...s,
          data: rest,
        };
      })
    );
  };

export const findTransactionsBySnapshot =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> => {
    return pipe(
      findSnapshot(os)(term),
      chain((s) =>
        findTransactionsByTerm(os)(
          s.data.ordinal,
          ["snapshotOrdinal"],
          pagination
        )
      )
    );
  };

export const findTransactionsByAddress =
  (os: Client) => (address: string, pagination: Pagination<Transaction>) =>
    findTransactionsByTerm(os)(address, ["source", "destination"], pagination);

export const findTransactionsByTerm =
  (os: Client) =>
  (
    term: string | number,
    fields: (keyof OpenSearchTransaction)[],
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    pipe(
      exportTransactionSortOptions(os)(pagination),
      chain<
        ApplicationError,
        SortOptions<OpenSearchTransaction>,
        PaginatedResult<OpenSearchTransaction>
      >((sortOptions) => {
        const query =
          fields.length === 1
            ? getByFieldQuery<
                OpenSearchTransaction,
                keyof OpenSearchTransaction
              >(OSIndex.Transactions, fields[0], term.toString(), sortOptions)
            : getMultiQuery<OpenSearchTransaction, keyof OpenSearchTransaction>(
                OSIndex.Transactions,
                fields,
                term.toString(),
                sortOptions
              );

        return pipe(
          findAll<OpenSearchTransaction>(os.search(query)),
          chain((a) => getResultWithNextString(a, sortOptions))
        );
      })
    );

export const findTransactionsBySource =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    findTransactionsByTerm(os)(term, ["source"], pagination);

export const findTransactionsByDestination =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, PaginatedResult<OpenSearchTransaction>> =>
    findTransactionsByTerm(os)(term, ["destination"], pagination);

export const findTransactionByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Result<Transaction>> =>
    pipe(
      findOne<OpenSearchTransaction>(
        os.get(
          getDocumentQuery<OpenSearchTransaction>(OSIndex.Transactions, hash)
        )
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
    ordinal?: number
  ): TaskEither<ApplicationError, Result<Balance>> =>
    pipe(
      findOne<OpenSearchBalance>(
        os.search(
          getByFieldQuery<OpenSearchBalance, "address">(
            OSIndex.Balances,
            "address",
            address,
            {
              options: [
                {
                  sortField: "snapshotOrdinal",
                  // To achieve (0, ordinal> we need to make (0, ordinal + 1)
                  ...(ordinal !== undefined
                    ? { searchSince: ordinal + 1 }
                    : {}),
                  searchDirection: SearchDirection.Before,
                },
              ],
              size: 1,
            }
          )
        )
      ),
      map(({ data: { address, balance }, meta }) => ({
        data: { address, balance },
        meta,
      })),
      orElse((e: ApplicationError) =>
        e.statusCode === StatusCodes.NOT_FOUND
          ? right({ data: { address, balance: 0 }, meta: {} })
          : left(e)
      )
    );

export const findBlockByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Result<Block>> =>
    findOne<OpenSearchBlock>(
      os.get(getDocumentQuery<OpenSearchBlock>(OSIndex.Blocks, hash))
    );

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
