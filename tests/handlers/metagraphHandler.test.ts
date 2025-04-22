import { APIGatewayProxyResult } from "aws-lambda";
import * as metagraphHandler from "../../src/handlers/metagraphHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import {
  data_addresses,
  data_metagraph_blocks,
  data_metagraph_snapshots,
  data_metagraph_transactions,
  prisma,
} from "../../prisma/seed";
const validateTransaction = (tx) => {
  const dbTxn = data_metagraph_transactions.filter(
    (_dbTxn) => _dbTxn.hash === tx.hash
  )[0];

  const dbBlock = data_metagraph_blocks.filter(
    (_dbBlock) => _dbBlock.hash === dbTxn.block_hash
  )[0];

  const dbSnapshot = data_metagraph_snapshots.filter(
    (_dbSnapshot) => _dbSnapshot.hash === dbBlock.metagraph_snapshot_hash
  )[0];

  expect(tx.hash).toBe(dbTxn.hash);
  expect(tx.source).toBe(dbTxn.source_addr);
  expect(tx.destination).toBe(dbTxn.destination_addr);
  expect(tx.amount).toBe(Number(dbTxn.amount));
  expect(tx.fee).toBe(Number(dbTxn.fee));
  expect(tx.snapshotHash).toBe(dbSnapshot.hash);
  expect(tx.snapshotOrdinal).toBe(Number(dbSnapshot.ordinal));
  expect(+new Date(tx.timestamp)).toBe(+new Date(dbTxn.created_at));
};

// These tests use a real database connection, so they're integration tests
describe("Metagraph Handler Integration Tests", () => {
  describe("currencySnapshots", () => {
    it("should return a list of metagraph snapshots", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult =
        await metagraphHandler.currencySnapshots(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(data_metagraph_snapshots.length);

      const testSnapshot = data_metagraph_snapshots.sort((a, b): number => {
        return a.ordinal < b.ordinal ? 1 : -1;
      })[0];

      // Verify the structure of the returned data
      const snapshot = body.data[0];
      expect(snapshot.ordinal).toBe(Number(testSnapshot.ordinal));
      expect(snapshot.hash).toBe(testSnapshot.hash);
      expect(snapshot.height).toBe(Number(testSnapshot.height));
      expect(snapshot.subHeight).toBe(Number(testSnapshot.subheight));
      expect(Array.isArray(snapshot.blocks)).toBe(true);
      expect(snapshot.timestamp).toBeDefined();
    });

    it("should handle pagination correctly", async () => {
      const event = createAPIGatewayEvent({}, { limit: "1" });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencySnapshots(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      // Ensure pagination is working
      expect(body.meta.next).toBeDefined();

      // Try getting the next page
      const nextEvent = createAPIGatewayEvent(
        {},
        {
          limit: "1",
          next: body.meta.next,
        }
      );

      const nextResponse = await metagraphHandler.currencySnapshots(nextEvent);
      expect(nextResponse.statusCode).toBe(200);

      const nextBody = validatePaginatedResponse(nextResponse);

      // Ensure we got a different set of results
      expect(nextBody.data[0].hash).not.toBe(body.data[0].hash);
    });
  });

  describe("currencyTransactions", () => {
    it("should return transactions sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0];

      const event = createAPIGatewayEvent();

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyTransactions(event);

      const transactions = await prisma.metagraph_transactions.findMany({
        include: {
          metagraph_blocks: {
            include: {
              metagraph_snapshot: { select: { ordinal: true } },
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      expect([
        body.data[0].snapshotOrdinal,
        body.data[1].snapshotOrdinal,
      ]).toEqual([2, 1]);

      validateTransaction(body.data[0]);
      validateTransaction(body.data[1]);
    });
  });

  describe("currencyTransactionsByAddress", () => {
    it("should return transactions for specified address sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0].address;

      const event = createAPIGatewayEvent({ address }, { limit: "10" });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyTransactionsByAddress(event);

      const transactions = await prisma.metagraph_transactions.findMany({
        where: {
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        include: {
          metagraph_blocks: {
            include: {
              metagraph_snapshot: { select: { ordinal: true } },
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      expect([
        body.data[0].snapshotOrdinal,
        body.data[1].snapshotOrdinal,
      ]).toEqual([2, 1]);

      validateTransaction(body.data[0]);
      validateTransaction(body.data[1]);
    });
  });

  describe("currencyBalanceByAddress", () => {
    it("should return balance for a given address", async () => {
      const testTxn = data_metagraph_transactions[0];

      const event = createAPIGatewayEvent({
        address: testTxn.destination_addr,
      });

      const response: APIGatewayProxyResult =
        await metagraphHandler.currencyBalanceByAddress(event);

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];

      expect(body.balance).toBe(Number(testTxn.amount));
      expect(body.address).toBe(testTxn.destination_addr);
      expect(body.ordinal).toBeDefined();
    });
  });
});
