import * as metagraphHandler from "../../src/handlers/metagraphHandler";
import { paginatedQuery } from "../../src/pagination";
import { extractPagination } from "../../src/request-params";
import { metagraphSnapshotsResponse } from "../../src/response";
import { createAPIGatewayEvent, parseResponseBody } from "../testUtils";
import { data_global_snapshots, prisma } from "../../prisma/seed";

const metagraph_id = "DAG7777777777777777777777777777777777777";

const snapshots = [1n, 2n, 3n, 5n, 8n, 9n, 12n].map((ordinal) => ({
  metagraph_id,
  global_snapshot_hash: data_global_snapshots[0].hash,
  ordinal,
  hash: `pagination-test-snapshot-${ordinal}`,
  height: ordinal,
  subheight: 0,
  owner_address: null,
  staking_address: null,
  epoch_progress: 1n,
  size: 1n,
  last_snapshot_hash: "0".repeat(64),
  fee: 1n,
  version: "0.0.1",
  created_at: new Date("2025-04-02T00:00:02Z"),
  updated_at: new Date("2025-04-02T00:00:02Z"),
}));

// The query currencySnapshots ran before it paged on ordinal: a Prisma cursor
// on hash. The handler must return the same pages.
const prismaCursorPage = async (query: Record<string, string>) => {
  const event = createAPIGatewayEvent({ identifier: metagraph_id }, query);
  const pagination = extractPagination(event);
  if ("searchSince" in pagination && pagination.searchSince) {
    (pagination.searchSince as any).metagraph_id = metagraph_id;
  }
  const cursor = (row) => ({ hash: row.hash });
  return paginatedQuery(
    pagination,
    cursor,
    cursor,
    {
      where: { metagraph_id },
      include: { metagraph_blocks: true },
      orderBy: [{ metagraph_id: "desc" }, { ordinal: "desc" }],
    },
    prisma.metagraph_snapshots.findMany,
    metagraphSnapshotsResponse
  );
};

const handlerPage = (query: Record<string, string>) =>
  metagraphHandler.currencySnapshots(
    createAPIGatewayEvent({ identifier: metagraph_id }, query)
  );

const expectSamePage = async (query: Record<string, string>) => {
  const expected = await prismaCursorPage(query);
  const actual = await handlerPage(query);
  expect(actual.statusCode).toBe(expected.statusCode);
  expect(parseResponseBody(actual)).toEqual(parseResponseBody(expected));
  return parseResponseBody(actual);
};

beforeAll(async () => {
  await prisma.metagraphs.create({
    data: { id: metagraph_id, created_at: new Date(), updated_at: new Date() },
  });
  await prisma.metagraph_snapshots.createMany({ data: snapshots });
});

afterAll(async () => {
  await prisma.metagraph_snapshots.deleteMany({ where: { metagraph_id } });
  await prisma.metagraphs.delete({ where: { id: metagraph_id } });
});

describe("currencySnapshots pagination", () => {
  it.each(["1", "2", "3", "100"])(
    "walks every next page like the Prisma cursor (limit %s)",
    async (limit) => {
      const seen: number[] = [];
      let next: string | undefined;
      do {
        const body = await expectSamePage(next ? { limit, next } : { limit });
        seen.push(...body.data.map((s) => s.ordinal));
        next = body.meta?.next;
      } while (next);
      expect(seen).toEqual([12, 9, 8, 5, 3, 2, 1]);
    }
  );

  it.each(["search_before", "search_after"])(
    "matches the Prisma cursor for %s from every snapshot",
    async (direction) => {
      for (const snapshot of snapshots) {
        for (const limit of ["1", "2", "10"]) {
          await expectSamePage({ [direction]: snapshot.hash, limit });
        }
      }
    }
  );

  it("returns an empty page for an unknown cursor", async () => {
    const body = await expectSamePage({ search_before: "no-such-snapshot" });
    expect(body.data).toEqual([]);
  });
});
