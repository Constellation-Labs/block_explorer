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
  getByFieldQuery,
  getDocumentQuery,
  getLatestQuery,
  getMultiQuery,
  SearchDirection,
  SortOptions,
} from "./query";

import { chain, map, TaskEither } from "fp-ts/lib/TaskEither";
import { Pagination } from "./validation";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";

enum OSIndex {
  Snapshots = "snapshots",
  Blocks = "blocks",
  Transactions = "transactions",
  Balances = "balances",
}

export const getClient = (): Client => {
  return new Client({ node: process.env.OPENSEARCH_NODE });
};

export const findSnapshotRewards = (
  os: Client
): TaskEither<ApplicationError, RewardTransaction[]> =>
  pipe(
    findOne<OpenSearchSnapshot>(
      os.search(getLatestQuery<OpenSearchSnapshot>(OSIndex.Snapshots))
    ),
    map((s) => s.rewards)
  );

export const findSnapshot =
  (os: Client) =>
  (term: string): TaskEither<ApplicationError, Snapshot> => {
    const find = () => {
      if (isLatest(term)) {
        return os.search(getLatestQuery<OpenSearchSnapshot>(OSIndex.Snapshots));
      }
      if (isOrdinal(term)) {
        return os.search(
          getByFieldQuery<OpenSearchSnapshot, "ordinal", "ordinal">(
            OSIndex.Snapshots,
            "ordinal",
            term,
            {
              sortField: "ordinal",
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
      map(({ rewards, ...snapshot }) => snapshot)
    );
  };

export const findTransactionsBySnapshot =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, OpenSearchTransaction[]> => {
    return pipe(
      findSnapshot(os)(term),
      chain((s) =>
        findTransactionsByTerm(os)(s.ordinal, ["snapshotOrdinal"], pagination)
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
  ): TaskEither<ApplicationError, OpenSearchTransaction[]> => {
    const sortOptions: SortOptions<OpenSearchTransaction, "hash"> = {
      ...pagination,
      sortField: "hash",
    };

    const query =
      fields.length === 1
        ? getByFieldQuery<
            OpenSearchTransaction,
            keyof OpenSearchTransaction,
            "hash"
          >(OSIndex.Transactions, fields[0], term.toString(), sortOptions)
        : getMultiQuery<
            OpenSearchTransaction,
            keyof OpenSearchTransaction,
            "hash"
          >(OSIndex.Transactions, fields, term.toString(), sortOptions);

    return findAll(os.search(query));
  };

export const findTransactionsBySource =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, Transaction[]> =>
    findTransactionsByTerm(os)(term, ["source"], pagination);

export const findTransactionsByDestination =
  (os: Client) =>
  (
    term: string,
    pagination: Pagination<Transaction>
  ): TaskEither<ApplicationError, Transaction[]> =>
    findTransactionsByTerm(os)(term, ["destination"], pagination);

export const findTransactionByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Transaction> =>
    pipe(
      findOne<OpenSearchTransaction>(
        os.get(
          getDocumentQuery<OpenSearchTransaction>(OSIndex.Transactions, hash)
        )
      ),
      map(({ salt, ...tx }) => tx)
    );

export const findBalanceByAddress =
  (os: Client) =>
  (address: string, ordinal?: number): TaskEither<ApplicationError, Balance> =>
    pipe(
      findOne<OpenSearchBalance>(
        os.search(
          getByFieldQuery<OpenSearchBalance, "address", "snapshotOrdinal">(
            OSIndex.Balances,
            "address",
            address,
            {
              sortField: "snapshotOrdinal",
              size: 1,
              // To achieve (0, ordinal> we need to make (0, ordinal + 1)
              ...(ordinal !== undefined ? { searchSince: ordinal + 1 } : {}),
              searchDirection: SearchDirection.Before,
            }
          )
        )
      ),
      map(({ address, balance }) => ({ address, balance }))
    );

export const findBlockByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Block> =>
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
