import { Client } from "@opensearch-project/opensearch";
import { pipe } from "fp-ts/lib/pipeable";

import { ApplicationError, StatusCodes } from "./http";
import {
  Block,
  OpenSearchBlock,
  RewardTransaction,
  Snapshot,
  Transaction,
} from "./model";
import {
  findAll,
  findOne,
  getByFieldQuery,
  getLatestQuery,
  getMultiQuery,
} from "./query";

import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";

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
  const search = (
    isLatest(term)
      ? getLatestQuery(OSIndex.Snapshots)
      : getByFieldQuery<Snapshot>(
          OSIndex.Snapshots,
          isOrdinal(term) ? "ordinal" : "hash",
          term,
          "ordinal"
        )
  )(os);

  return findOne(search);
};

export const findTransactionsByAddress =
  (os: Client) =>
  (
    term: string,
    field: keyof Transaction | null = null
  ): TaskEither<ApplicationError, Transaction[]> => {
    console.log("findTransactionsByAddress", field, term);
    const search =
      field !== null
        ? getByFieldQuery<Transaction>(
            OSIndex.Transactions,
            field,
            term,
            "snapshotOrdinal"
          )
        : getMultiQuery<Transaction>(
            OSIndex.Transactions,
            ["source", "destination"],
            term
          );

    return findAll(search(os));
  };

export const findTransactionsBySource =
  (os: Client) =>
  (term: string): TaskEither<ApplicationError, Transaction[]> =>
    findTransactionsByAddress(os)(term, "source");

export const findTransactionsByDestination =
  (os: Client) =>
  (
    term: string,
    searchAfter: number = 0
  ): TaskEither<ApplicationError, Transaction[]> =>
    findTransactionsByAddress(os)(term, "destination");

export const findTransactionByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Transaction> =>
    findOne(
      getByFieldQuery<Transaction>(
        OSIndex.Transactions,
        "hash",
        hash,
        "snapshotOrdinal"
      )(os)
    );

export const findSnapshotRewards = (
  os: Client
): TaskEither<ApplicationError, RewardTransaction[]> =>
  pipe(
    findSnapshot(os)("latest"),
    TE.map((snapshot) => snapshot.rewards)
  );

export const findBlockByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Block> =>
    findOne(
      getByFieldQuery<OpenSearchBlock>(
        OSIndex.Blocks,
        "hash",
        hash,
        "snapshotOrdinal"
      )(os)
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
