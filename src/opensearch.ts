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
  Hash,
  OpenSearchBlock,
  OpenSearchSnapshot,
  Ordinal,
  RewardTransaction,
  Snapshot,
  WithRewards,
  WithTimestamp,
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
    predicateValue: string | number | "latest" = "latest"
  ): TaskEither<ApplicationError, Snapshot> => {
    const outerIncludes: (keyof Snapshot)[] = [
      "ordinal",
      "hash",
      "height",
      "subHeight",
      "timestamp",
      "blocks",
    ];
    const osSearch = getSnapshotQuery<OpenSearchSnapshot>(
      predicateName,
      predicateValue,
      outerIncludes
    )(os);

    return pipe(findOuter(osSearch), chain(extractSnapshot));
  };

export const getSnapshotRewards =
  (os: Client) =>
  (
    predicateName: string,
    predicateValue: string | number | "latest" = "latest"
  ): TaskEither<ApplicationError, RewardTransaction[]> => {
    const outerIncludes: (keyof (Snapshot & WithRewards))[] = ["rewards"];
    const osSearch = getSnapshotQuery<WithRewards>(
      predicateName,
      predicateValue,
      outerIncludes
    )(os);

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
    value: string | number | "latest",
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
    predicateValue: string | number | "latest",
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

function extractSnapshot(
  res: OpenSearchSnapshot[]
): TaskEither<ApplicationError, Snapshot> {
  return pipe(O.fromNullable(res[0]), fromOption(serverError));
}

function extractRewards(
  res: WithRewards[]
): TaskEither<ApplicationError, RewardTransaction[]> {
  return pipe(
    pipe(
      O.fromNullable(res[0]),
      O.map((withRewards) => withRewards.rewards)
    ),
    fromOption(serverError)
  );
}

function extractBlock(
  res: ExtractedResult<WithTimestamp & Hash, OpenSearchBlock>[]
): TaskEither<ApplicationError, Block> {
  return pipe(
    O.fromNullable(res[0]),
    O.chain((res) =>
      pipe(
        O.fromNullable(res.inner[0]),
        O.map((osBlock) => {
          const snapshot = res.outer;

          return {
            hash: osBlock.hash,
            height: osBlock.height,
            transactions: osBlock.transactions.map((t) => t.hash),
            parent: osBlock.parent,
            snapshot: snapshot.hash,
            timestamp: snapshot.timestamp,
          };
        })
      )
    ),
    fromOption(serverError)
  );
}

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
