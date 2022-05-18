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
} from "./model";
import {
  findAll,
  findOne,
  getByFieldQuery,
  getLatestQuery,
  getMultiQuery,
  SearchDirection,
} from "./query";

import { chain, map, TaskEither } from "fp-ts/lib/TaskEither";

enum OSIndex {
  Snapshots = "snapshots",
  Blocks = "blocks",
  Transactions = "transactions",
  Balances = "balances",
}

export const getClient = (): Client => {
  return new Client({ node: process.env.OPENSEARCH_NODE });
};

export const findSnapshot = (os: Client) => (term: string) => {
  const query = isLatest(term)
    ? getLatestQuery(OSIndex.Snapshots)
    : getByFieldQuery<OpenSearchSnapshot, "ordinal" | "hash", "ordinal">(
        OSIndex.Snapshots,
        isOrdinal(term) ? "ordinal" : "hash",
        term,
        { sortField: "ordinal" }
      );

  return findOne<OpenSearchSnapshot>(os.search(query));
};

export const findTransactionsBySnapshot =
  (os: Client) =>
  (term: string): TaskEither<ApplicationError, OpenSearchTransaction[]> => {
    if (isLatest(term)) {
      return pipe(
        findSnapshot(os)(term),
        chain((s) => {
          return findTransactionsByTerm(os)(s.ordinal, ["snapshotOrdinal"]);
        })
      );
    }

    return findTransactionsByTerm(os)(term, [
      isOrdinal(term) ? "snapshotOrdinal" : "snapshotHash",
    ]);
  };

export const findTransactionsByAddress = (os: Client) => (address: string) =>
  findTransactionsByTerm(os)(address, ["source", "destination"]);

export const findTransactionsByTerm =
  (os: Client) =>
  (
    term: string | number,
    fields: (keyof OpenSearchTransaction)[]
  ): TaskEither<ApplicationError, OpenSearchTransaction[]> => {
    const query =
      fields.length === 1
        ? getByFieldQuery<
            OpenSearchTransaction,
            keyof OpenSearchTransaction,
            "snapshotOrdinal"
          >(OSIndex.Transactions, fields[0], term.toString(), {
            sortField: "snapshotOrdinal",
          })
        : getMultiQuery<
            OpenSearchTransaction,
            keyof OpenSearchTransaction,
            "snapshotOrdinal"
          >(OSIndex.Transactions, fields, term.toString(), {
            sortField: "snapshotOrdinal",
          });

    return findAll(os.search(query));
  };

export const findTransactionsBySource =
  (os: Client) =>
  (term: string): TaskEither<ApplicationError, OpenSearchTransaction[]> =>
    findTransactionsByTerm(os)(term, ["source"]);

export const findTransactionsByDestination =
  (os: Client) =>
  (term: string): TaskEither<ApplicationError, OpenSearchTransaction[]> =>
    findTransactionsByTerm(os)(term, ["destination"]);

export const findTransactionByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, OpenSearchTransaction> =>
    findOne(
      os.search(
        getByFieldQuery<OpenSearchTransaction, "hash", "snapshotOrdinal">(
          OSIndex.Transactions,
          "hash",
          hash,
          {
            sortField: "snapshotOrdinal",
          }
        )
      )
    );

export const findBalanceByAddress =
  (os: Client) =>
  (address: string, ordinal: number): TaskEither<ApplicationError, Balance> =>
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
              searchSince: ordinal + 1, // To achieve (0, ordinal> we need to make (0, ordinal + 1)
              searchDirection: SearchDirection.Before,
            }
          )
        )
      ),
      map(({ address, balance }) => ({ address, balance }))
    );

export const findSnapshotRewards = (
  os: Client
): TaskEither<ApplicationError, RewardTransaction[]> =>
  pipe(
    findSnapshot(os)("latest"),
    map((s) => s.rewards)
  );

export const findBlockByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Block> =>
    findOne(
      os.search(
        getByFieldQuery<OpenSearchBlock, "hash", "snapshotOrdinal">(
          OSIndex.Blocks,
          "hash",
          hash,
          { sortField: "snapshotOrdinal" }
        )
      )
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
