import { Client } from "@opensearch-project/opensearch";
import { pipe } from "fp-ts/lib/pipeable";

import { ApplicationError, StatusCodes } from "./http";
import {
  Block,
  OpenSearchBlock,
  OpenSearchSnapshot,
  RewardTransaction,
  Snapshot,
  OpenSearchTransaction,
} from "./model";
import {
  findAll,
  findOne,
  getByFieldQuery,
  getLatestQuery,
  getMultiQuery,
} from "./query";

import { map, chain, TaskEither } from "fp-ts/lib/TaskEither";

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

  return findOne<OpenSearchSnapshot>(search);
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
    const search =
      fields.length === 1
        ? getByFieldQuery<OpenSearchTransaction>(
            OSIndex.Transactions,
            fields[0],
            term.toString(),
            "snapshotOrdinal"
          )
        : getMultiQuery<OpenSearchTransaction>(
            OSIndex.Transactions,
            fields,
            term.toString()
          );

    return findAll(search(os));
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
      getByFieldQuery<OpenSearchTransaction>(
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
    map((s) => s.rewards)
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
