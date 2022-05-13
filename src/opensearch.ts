import { ApiResponse, Client } from "@opensearch-project/opensearch";
import {
  QueryDslNestedQuery,
  SearchResponse,
} from "@opensearch-project/opensearch/api/types";
import { TransportRequestPromise } from "@opensearch-project/opensearch/lib/Transport";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { chain, fromOption, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { ExtractedResult, extractInnerHits, extractOuterHits } from "./extract";
import { ApplicationError, StatusCodes } from "./http";
import {
  Balance,
  BalanceValue,
  Block,
  OpenSearchBlock,
  OpenSearchSnapshot,
  OpenSearchTransaction,
  Ordinal,
  RewardTransaction,
  Snapshot,
  Transaction,
  WithRewards,
} from "./model";
import {
  fieldTerm,
  getByFieldNestedQuery,
  getLatestQuery,
  getQuery,
} from "./queries";

enum OSIndex {
  Snapshots = "snapshots",
  Blocks = "blocks",
  Transactions = "transactions",
  Balances = "balances",
}

export const getClient = (): Client => {
  return new Client({ node: process.env.OPENSEARCH_NODE });
};

export const getSnapshot =
  (os: Client) =>
  (
    predicateName: string,
    predicateValue: string = "latest"
  ): TaskEither<ApplicationError, Snapshot> => {
    type OuterResult = OpenSearchSnapshot;
    const outerIncludes: (keyof OuterResult)[] = [
      "ordinal",
      "hash",
      "height",
      "subHeight",
      "timestamp",
      "blocks",
    ];

    const osSearch = getSnapshotQuery<OuterResult>(
      predicateName,
      predicateValue,
      outerIncludes
    )(os);

    const extractSnapshot = (
      res: OuterResult[]
    ): TaskEither<ApplicationError, Snapshot> =>
      pipe(O.fromNullable(res[0]), fromOption(serverError));

    return pipe(findOuter(osSearch), chain(extractSnapshot));
  };

export const getSnapshotRewards =
  (os: Client) =>
  (
    predicateName: string,
    predicateValue: string = "latest"
  ): TaskEither<ApplicationError, RewardTransaction[]> => {
    const outerIncludes: (keyof (Snapshot & WithRewards))[] = ["rewards"];
    const osSearch = getSnapshotQuery<WithRewards>(
      predicateName,
      predicateValue,
      outerIncludes
    )(os);

    const extractRewards = (
      res: WithRewards[]
    ): TaskEither<ApplicationError, RewardTransaction[]> =>
      pipe(
        pipe(
          O.fromNullable(res[0]),
          O.map((withRewards) => withRewards.rewards)
        ),
        fromOption(serverError)
      );

    return pipe(findOuter(osSearch), chain(extractRewards));
  };

export const getBlockByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Block> => {
    type OuterResult = Omit<OpenSearchBlock, "snapshotOrdinal">;
    const outerIncludes: (keyof OuterResult)[] = [
      "hash",
      "height",
      "transactions",
      "parent",
      "timestamp",
      "snapshotHash",
    ];

    const extractBlock = (
      res: OuterResult[]
    ): TaskEither<ApplicationError, Block> =>
      pipe(
        O.fromNullable(res[0]),
        O.map<OuterResult, Block>((osBlock) => {
          const { snapshotHash, ...rest } = osBlock;
          return {
            ...rest,
            snapshot: snapshotHash,
          } as Block;
        }),
        fromOption(serverError)
      );

    const osSearch = getByFieldQuery<OuterResult>(
      OSIndex.Blocks,
      "hash",
      hash,
      outerIncludes
    );

    return pipe(findOuter(osSearch(os)), chain(extractBlock));
  };

export const getTransactionByHash =
  (os: Client) =>
  (hash: string): TaskEither<ApplicationError, Transaction> => {
    type OuterResult = Omit<OpenSearchTransaction, "snapshotOrdinal">;
    const outerIncludes: (keyof OuterResult)[] = [
      "hash",
      "source",
      "destination",
      "amount",
      "fee",
      "parent",
      "snapshotHash",
      "blockHash",
      "timestamp",
    ];

    const extractTransaction = (
      res: OuterResult[]
    ): TaskEither<ApplicationError, Transaction> =>
      pipe(
        O.fromNullable(res[0]),
        O.map<OuterResult, Transaction>((osTx) => {
          const { snapshotHash, blockHash, ...rest } = osTx;
          return {
            ...rest,
            snapshot: snapshotHash,
            block: blockHash,
          } as Transaction;
        }),
        fromOption(serverError)
      );

    const osSearch = getByFieldQuery<OuterResult>(
      OSIndex.Transactions,
      "hash",
      hash,
      outerIncludes
    );

    return pipe(findOuter(osSearch(os)), chain(extractTransaction));
  };

// TODO
export const getBalanceByAddress =
  (os: Client) =>
  (
    address: string,
    ordinal: string = "latest"
  ): TaskEither<ApplicationError, Balance> => {
    const innerPath = "info.balances";
    const nested = getByFieldNestedQuery(innerPath, "address", address, [
      "balance",
    ]);
    const osSearch = getSnapshotQuery<Ordinal>(
      "ordinal",
      ordinal,
      ["ordinal"],
      nested
    )(os);

    return pipe(findInner(innerPath)(osSearch), chain(extractBalance));
  };

const getByFieldQuery =
  <T>(
    index: string,
    field: string,
    value: string,
    includes: string[] = [],
    nestedBody?: QueryDslNestedQuery,
    size: number | null = 1
  ) =>
  (os: Client) => {
    const fieldQuery = fieldTerm(field, value);
    return os.search<SearchResponse<T>>(
      getQuery(index, includes, fieldQuery, nestedBody, size)
    );
  };

const getAllQuery =
  <T>(
    includes: string[] = [],
    nestedBody?: QueryDslNestedQuery,
    size: number | null = 1
  ) =>
  (os: Client) => {
    return os.search<SearchResponse<T>>(
      getQuery(OSIndex.Snapshots, includes, undefined, nestedBody, size)
    );
  };

const getLatestOrdinalQuery =
  <T>(
    index: string,
    includes: string[] = [],
    nestedBody?: QueryDslNestedQuery
  ) =>
  (os: Client) =>
    os.search<SearchResponse<T>>(getLatestQuery(index, nestedBody, includes));

const isLatest = (
  termName: string,
  termValue: string | number | "latest"
): boolean => termName === "ordinal" && termValue === "latest";

const getSnapshotQuery =
  <T>(
    predicateName: string,
    predicateValue: string,
    includes: string[] = [],
    nestedBody?: QueryDslNestedQuery,
    size: number | null = 1
  ) =>
  (os: Client) => {
    return isLatest(predicateName, predicateValue)
      ? getLatestOrdinalQuery<T>(OSIndex.Snapshots!, includes, nestedBody)(os)
      : getByFieldQuery<T>(
          OSIndex.Snapshots!,
          predicateName,
          predicateValue,
          includes,
          nestedBody,
          size
        )(os);
  };

function extractBalance(
  res: ExtractedResult<Ordinal, BalanceValue>[]
): TaskEither<ApplicationError, Balance> {
  return pipe(
    pipe(
      O.fromNullable(res[0]),
      O.chain((res) =>
        pipe(
          O.fromNullable(res.inner[0]),
          O.map((balance) => {
            return { ...res.outer, ...balance };
          })
        )
      ),
      fromOption(serverError)
    )
  );
}

const serverError = () =>
  new ApplicationError(
    "Server Error",
    ["Malformed data."],
    StatusCodes.SERVER_ERROR
  );

const findOuter = <T>(
  search: TransportRequestPromise<ApiResponse<SearchResponse<T>>>
) =>
  pipe(
    find(search),
    chain((body) => extractOuterHits<T>(body))
  );

const findInner =
  <T, U>(innerPath: string) =>
  (search: TransportRequestPromise<ApiResponse<SearchResponse<T>>>) =>
    pipe(
      find(search),
      chain((body) => extractInnerHits<T, U>(innerPath, body))
    );

const find = <T>(
  search: TransportRequestPromise<ApiResponse<SearchResponse<T>>>
) =>
  tryCatch<ApplicationError, SearchResponse<T>>(
    () => search.then((r) => r.body),
    (err) =>
      new ApplicationError(
        "OpenSearch error",
        [err as string],
        StatusCodes.SERVER_ERROR
      )
  );
