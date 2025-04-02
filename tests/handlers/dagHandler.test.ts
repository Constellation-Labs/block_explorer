import { APIGatewayProxyResult } from "aws-lambda";
import * as dagHandler from "../../src/handlers/dagHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { seed } from "../../prisma/seed";

let testData, prismaClient;
const runSeedOnce = async () => {
  if (testData) return testData;

  prismaClient = new PrismaClient();
  testData = await seed();
};

// These tests use a real database connection, so they're integration tests
describe("DAG Handler Integration Tests", () => {
  describe("globalSnapshots", () => {
    it("should return a list of global snapshots", async () => {
      await runSeedOnce();

      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult = await dagHandler.globalSnapshots(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(testData.global_snapshots.length);

      const testSnapshot = testData.global_snapshots.sort((a, b): number => {
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
      await runSeedOnce();

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
      await runSeedOnce();

      const event = createAPIGatewayEvent({ term: "latest" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      const testSnapshot = testData.global_snapshots.sort((a, b): number => {
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
      const testData = await runSeedOnce();

      const requestedSnapshot = testData.global_snapshots[1];

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
      await runSeedOnce();

      const event = createAPIGatewayEvent({ term: "nonexistent-hash" });

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshot(
        event
      );

      expect(response.statusCode).toBe(404);
    });
  });

  describe("globalSnapshotTransactions", () => {
    it("should return transactions for the latest global snapshot", async () => {
      const testData = await runSeedOnce();

      const requestedSnapshot = testData.global_snapshots[1];

      const event = createAPIGatewayEvent(
        { term: requestedSnapshot.ordinal },
        { limit: "10" }
      );

      const response: APIGatewayProxyResult = await dagHandler.globalSnapshotTransactions(
        event
      );

      const transactions = await prismaClient.dag_transactions.findMany({
        where: {
          dag_blocks: { snapshot_hash: requestedSnapshot.hash },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);

      expect(body.data.length).toBe(transactions.length);

      const tx = body.data[0];

      const dbTxn = testData.dag_transactions.filter(
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
      const testData = await runSeedOnce();

      const event = createAPIGatewayEvent({
        hash: testData.dag_transactions[0].hash,
      });

      const response: APIGatewayProxyResult = await dagHandler.dagTransaction(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response);

      const tx = body.data;

      const dbTxn = testData.dag_transactions.filter(
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
      await runSeedOnce();

      const event = createAPIGatewayEvent({ hash: "nonexistent-hash" });

      const response: APIGatewayProxyResult = await dagHandler.dagTransaction(
        event
      );

      expect(response.statusCode).toBe(404);
    });
  });

  describe("dagBalanceByAddress", () => {
    it("should return balance for a given address", async () => {
      const testData = await runSeedOnce();

      const testTxn = testData.dag_transactions[0];

      const event = createAPIGatewayEvent({ address: testTxn.destination_addr });

      const response: APIGatewayProxyResult = await dagHandler.dagBalanceByAddress(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)['data'];

      expect(body.balance).toBe(Number(testTxn.amount));
      expect(body.address).toBe(testTxn.destination_addr);
      expect(body.ordinal).toBeDefined();
    });
  });
});
