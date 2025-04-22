import { APIGatewayProxyResult } from "aws-lambda";
import * as dagHandler from "../../src/handlers/dagHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import {
  data_addresses,
  data_dag_blocks,
  data_dag_transactions,
  data_global_snapshots,
  prisma,
} from "../../prisma/seed";

const validateTransaction = (tx) => {
  const dbTxn = data_dag_transactions.filter(
    (_dbTxn) => _dbTxn.hash === tx.hash
  )[0];

  const dbBlock = data_dag_blocks.filter(
    (_dbBlock) => _dbBlock.hash === dbTxn.block_hash
  )[0];

  const dbSnapshot = data_global_snapshots.filter(
    (_dbSnapshot) => _dbSnapshot.hash === dbBlock.snapshot_hash
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
describe("DAG Handler Integration Tests", () => {
  describe("globalSnapshots", () => {
    it("should return a list of global snapshots", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult = await dagHandler.globalSnapshots(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(data_global_snapshots.length);

      const testSnapshot = data_global_snapshots.sort((a, b): number => {
        return a.ordinal < b.ordinal ? 1 : -1;
      })[0];

      // Verify the structure of the returned data
      const snapshot = body.data[0];
      expect(snapshot.ordinal).toBe(Number(testSnapshot.ordinal));
      expect(snapshot.hash).toBe(testSnapshot.hash);
      expect(snapshot.epochProgress).toBe(Number(testSnapshot.epoch_progress));
      expect(snapshot.height).toBe(Number(testSnapshot.height));
      expect(snapshot.subHeight).toBe(Number(testSnapshot.subheight));
      expect(Array.isArray(snapshot.blocks)).toBe(true);
      expect(snapshot.timestamp).toBeDefined();
    });

    it("should handle pagination correctly", async () => {
      const event = createAPIGatewayEvent({}, { limit: "1" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshots(
        event
      );

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

      const nextResponse = await dagHandler.globalSnapshots(nextEvent);
      expect(nextResponse.statusCode).toBe(200);

      const nextBody = validatePaginatedResponse(nextResponse);

      // Ensure we got a different set of results
      expect(nextBody.data[0].hash).not.toBe(body.data[0].hash);
    });
  });

  describe("globalSnapshot", () => {
    it('should return the latest global snapshot when term is "latest"', async () => {
      const event = createAPIGatewayEvent({ term: "latest" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      const testSnapshot = data_global_snapshots.sort((a, b): number => {
        return a.ordinal < b.ordinal ? 1 : -1;
      })[0];

      // Verify the structure of the returned data
      expect(body.data.ordinal).toBe(Number(testSnapshot.ordinal));
      expect(body.data.hash).toBe(testSnapshot.hash);
      expect(body.data.epochProgress).toBe(Number(testSnapshot.epoch_progress));
      expect(body.data.height).toBe(Number(testSnapshot.height));
      expect(body.data.subHeight).toBe(Number(testSnapshot.subheight));
      expect(Array.isArray(body.data.blocks)).toBe(true);
      expect(body.data.timestamp).toBeDefined();
    });

    it("should return a specific global snapshot when a valid hash is provided", async () => {
      const requestedSnapshot = data_global_snapshots[1];

      // First get the latest global snapshot to get a valid hash
      const event = createAPIGatewayEvent({ term: requestedSnapshot.hash });
      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      // Assert
      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      // Verify we got the same snapshot
      expect(body.data.hash).toBe(requestedSnapshot.hash);
      expect(body.data.ordinal).toBe(Number(requestedSnapshot.ordinal));
    });

    it("should return 404 for non-existent global snapshot", async () => {
      const event = createAPIGatewayEvent({ term: "nonexistent-hash" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      expect(response.statusCode).toBe(404);
    });
  });

  describe("globalSnapshotTransactions", () => {
    it("should return transactions for the latest global snapshot", async () => {
      const requestedSnapshot = data_global_snapshots[1];

      const event = createAPIGatewayEvent(
        { term: requestedSnapshot.ordinal.toString() },
        { limit: "10" }
      );

      const response: APIGatewayProxyResult =
        await dagHandler.globalSnapshotTransactions(event);

      const transactions = await prisma.dag_transactions.findMany({
        where: {
          dag_blocks: { snapshot_hash: requestedSnapshot.hash },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      const tx = body.data[0];

      const dbTxn = data_dag_transactions.filter(
        (_dbTxn) => _dbTxn.hash === tx.hash
      )[0];

      expect(tx.hash).toBe(dbTxn.hash);
      expect(tx.source).toBe(dbTxn.source_addr);
      expect(tx.destination).toBe(dbTxn.destination_addr);
      expect(tx.amount).toBe(Number(dbTxn.amount));
      expect(tx.fee).toBe(Number(dbTxn.fee));
      expect(tx.snapshotHash).toBe(requestedSnapshot.hash);
      expect(tx.snapshotOrdinal).toBe(Number(requestedSnapshot.ordinal));
      expect(+new Date(tx.timestamp)).toBe(+new Date(dbTxn.created_at));
    });
  });

  describe("dagTransaction", () => {
    it("should return a specific transaction by hash", async () => {
      const event = createAPIGatewayEvent({
        hash: data_dag_transactions[0].hash,
      });

      const response: APIGatewayProxyResult = await dagHandler.dagTransaction(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      const tx = body.data;

      const dbTxn = data_dag_transactions.filter(
        (_dbTxn) => _dbTxn.hash === tx.hash
      )[0];

      expect(tx.hash).toBe(dbTxn.hash);
      expect(tx.source).toBe(dbTxn.source_addr);
      expect(tx.destination).toBe(dbTxn.destination_addr);
      expect(tx.amount).toBe(Number(dbTxn.amount));
      expect(tx.fee).toBe(Number(dbTxn.fee));
      expect(tx.snapshotHash).toBeDefined();
      expect(tx.snapshotOrdinal).toBeDefined();
      expect(+new Date(tx.timestamp)).toBe(+new Date(dbTxn.created_at));
    });

    it("should return 404 for non-existent transaction", async () => {
      const event = createAPIGatewayEvent({ hash: "nonexistent-hash" });

      const response: APIGatewayProxyResult = await dagHandler.dagTransaction(
        event
      );

      expect(response.statusCode).toBe(404);
    });
  });

  describe("dagTransactions", () => {
    it("should return transactions sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0];

      const event = createAPIGatewayEvent();

      const response: APIGatewayProxyResult = await dagHandler.dagTransactions(
        event
      );

      const transactions = await prisma.dag_transactions.findMany({
        include: {
          dag_blocks: {
            include: {
              global_snapshot: { select: { ordinal: true } },
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
      ]).toEqual([2556536, 2556535]);

      validateTransaction(body.data[0]);
      validateTransaction(body.data[1]);
    });
  });

  describe("dagTransactionsByAddress", () => {
    it("should return transactions for specified address sorted by snapshot ordinal descending", async () => {
      const address = data_addresses[0].address;

      const event = createAPIGatewayEvent({ address }, { limit: "10" });

      const response: APIGatewayProxyResult =
        await dagHandler.dagTransactionsByAddress(event);

      const transactions = await prisma.dag_transactions.findMany({
        where: {
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        include: {
          dag_blocks: {
            include: {
              global_snapshot: { select: { ordinal: true } },
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
      ]).toEqual([2556536, 2556535]);

      validateTransaction(body.data[0]);
      validateTransaction(body.data[1]);
    });
  });

  describe("dagBalanceByAddress", () => {
    it("should return balance for a given address", async () => {
      const testTxn = data_dag_transactions[0];

      const event = createAPIGatewayEvent({
        address: testTxn.destination_addr,
      });

      const response: APIGatewayProxyResult =
        await dagHandler.dagBalanceByAddress(event);

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];

      expect(body.balance).toBe(Number(testTxn.amount));
      expect(body.address).toBe(testTxn.destination_addr);
      expect(body.ordinal).toBeDefined();
    });
  });
});
