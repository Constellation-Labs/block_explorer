import { APIGatewayProxyResult } from "aws-lambda";
import * as allowSpendsHandler from "../../src/handlers/allowSpendsHandler";
import {
  createAPIGatewayEvent,
  validatePaginatedResponse,
  validateResponseStructure,
} from "../testUtils";
import {
  data_addresses,
  data_dag_allow_spends,
  data_dag_expired_spend_transactions,
  data_dag_spend_transactions,
  data_global_snapshots,
  data_metagraph_allow_spends,
  data_metagraph_expired_spend_transactions,
  data_metagraph_snapshots,
  data_metagraph_spend_transactions,
  data_metagraphs,
  prisma,
} from "../../prisma/seed";

// Helper validations
const validateDagAllowSpend = (entry) => {
  const match = data_dag_allow_spends.find((d) => d.hash === entry.hash);
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.hash).toBe(match.hash);
  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(Number(entry.fee)).toBe(Number(match.fee));
  expect(Number(entry.ordinal)).toBe(Number(match.ordinal));
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateDagSpendTransaction = (entry) => {
  const match = data_dag_spend_transactions.find((d) => d.hash === entry.hash);
  expect(match).toBeDefined();
  if (!match) return;

  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateDagExpiredSpend = (entry) => {
  const match = data_dag_expired_spend_transactions.find(
    (d) => d.hash === entry.hash
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateMgAllowSpend = (entry) => {
  const match = data_metagraph_allow_spends.find((d) => d.hash === entry.hash);
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.hash).toBe(match.hash);
  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(Number(entry.fee)).toBe(Number(match.fee));
  expect(entry.timestamp).toBeDefined();
};

const validateMgSpendTransaction = (entry) => {
  const match = data_metagraph_spend_transactions.find(
    (d) => d.hash === entry.hash
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

const validateMgExpiredSpend = (entry) => {
  const match = data_metagraph_expired_spend_transactions.find(
    (d) => d.hash === entry.hash
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
};

describe("AllowSpends Handler Integration Tests", () => {
  describe("allowSpends", () => {
    it("should return a list of allow spends", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult =
        await allowSpendsHandler.allowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_dag_allow_spends.length);
      body.data.forEach(validateDagAllowSpend);
    });

    it("should return active allow spends", async () => {
      const event = createAPIGatewayEvent({}, { active: "true" });
      const response: APIGatewayProxyResult =
        await allowSpendsHandler.allowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
      body.data.forEach(validateDagAllowSpend);
    });
  });

  describe("allowSpend", () => {
    it("should return a specific allow spend by hash", async () => {
      const hash = data_dag_allow_spends[0].hash;
      const event = createAPIGatewayEvent({ hash });

      const response = await allowSpendsHandler.allowSpend(event);
      expect(response.statusCode).toBe(200);

      const body = validateResponseStructure(response)["data"];
      validateDagAllowSpend(body);
    });
  });

  describe("globalSnapshotAllowSpends", () => {
    it("should return allow spends for a specific global snapshot", async () => {
      const hash_or_ordinal = data_global_snapshots[0].hash;
      const event = createAPIGatewayEvent({ hash_or_ordinal });

      const response = await allowSpendsHandler.globalSnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(3);
      body.data.forEach(validateDagAllowSpend);
    });

    it("should return active only allow spends for a specific global snapshot", async () => {
      const hash_or_ordinal = data_global_snapshots[0].hash;
      const event = createAPIGatewayEvent(
        { hash_or_ordinal },
        { active: "true" }
      );

      const response = await allowSpendsHandler.globalSnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateDagAllowSpend);
    });
  });

  describe("addressAllowSpends", () => {
    it("should return allow spends for a specific address", async () => {
      const address = data_addresses[3].address;
      const event = createAPIGatewayEvent({ address });

      const response = await allowSpendsHandler.addressAllowSpends(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateDagAllowSpend);
    });
    it("should return active only allow spends for a specific address", async () => {
      const address = data_addresses[3].address;
      const event = createAPIGatewayEvent({ address }, { active: "true" });

      const response = await allowSpendsHandler.addressAllowSpends(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateDagAllowSpend);
    });
  });

  describe("spendTransactions", () => {
    it("should return spend transactions", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await allowSpendsHandler.spendTransactions(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_dag_spend_transactions.length);
      validateDagSpendTransaction(body.data[0]);
    });
  });

  describe("allowSpendExpirations", () => {
    it("should return expired spend transactions", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await allowSpendsHandler.allowSpendExpirations(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_dag_expired_spend_transactions.length);
      validateDagExpiredSpend(body.data[0]);
    });
  });

  describe("addressSpendTransactions", () => {
    it("should return spend transactions for a specific address", async () => {
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ address });

      const response = await allowSpendsHandler.addressSpendTransactions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(validateDagSpendTransaction);
    });
  });

  describe("addressAllowSpendExpirations", () => {
    it("should return expired spend transactions for an address", async () => {
      const address = data_addresses[2].address;
      const event = createAPIGatewayEvent({ address });

      const response = await allowSpendsHandler.addressAllowSpendExpirations(
        event
      );
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(validateDagExpiredSpend);
    });
  });
});

describe("Metagraph AllowSpends Handler Integration Tests", () => {
  describe("currencyAllowSpends", () => {
    it("should return all allow spends", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
      });
      const response = await allowSpendsHandler.currencyAllowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(3);
      body.data.forEach(validateMgAllowSpend);
    });

    it("should return active allow spends only", async () => {
      const event = createAPIGatewayEvent(
        { metagraph_id: data_metagraphs[0].id },
        { active: "true" }
      );
      const response = await allowSpendsHandler.currencyAllowSpends(event);

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgAllowSpend);
    });
  });

  describe("currencySpendTransactions", () => {
    it("should return spend transactions", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
      });
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(data_metagraph_spend_transactions.length);
      body.data.forEach(validateMgSpendTransaction);
    });
  });

  describe("currencyAllowSpendExpirations", () => {
    it("should return expired spend transactions", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
      });
      const response = await allowSpendsHandler.currencyAllowSpendExpirations(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(
        data_metagraph_expired_spend_transactions.length
      );
      body.data.forEach(validateMgExpiredSpend);
    });
  });

  describe("currencySnapshotAllowSpends", () => {
    it("should return allow spends for a snapshot", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        hash_or_ordinal: data_metagraph_snapshots[0].hash,
      });

      const response = await allowSpendsHandler.currencySnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgAllowSpend);
    });
    it("should return active only allow spends for a snapshot", async () => {
      const event = createAPIGatewayEvent(
        {
          metagraph_id: data_metagraphs[0].id,
          hash_or_ordinal: data_metagraph_snapshots[1].hash,
        },
        { active: "true" }
      );

      const response = await allowSpendsHandler.currencySnapshotAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgAllowSpend);
    });
  });

  describe("currencySnapshotSpendTransactions", () => {
    it("should return spend transactions for a snapshot", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        hash_or_ordinal: data_metagraph_snapshots[0].hash,
      });

      const response =
        await allowSpendsHandler.currencySnapshotSpendTransactions(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgSpendTransaction);
    });
  });

  describe("currencySnapshotAllowSpendExpirations", () => {
    it("should return expired spend transactions for a snapshot", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        hash_or_ordinal: data_metagraph_snapshots[1].hash,
      });

      const response =
        await allowSpendsHandler.currencySnapshotAllowSpendExpirations(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      body.data.forEach(validateMgExpiredSpend);
    });
  });

  describe("currencyAddressAllowSpends", () => {
    it("should return allow spends for an address", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        address: data_addresses[1].address,
      });

      const response = await allowSpendsHandler.currencyAddressAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
    });
    it("should return active only allow spends for an address", async () => {
      const event = createAPIGatewayEvent(
        {
          metagraph_id: data_metagraphs[0].id,
          address: data_addresses[1].address,
        },
        { active: "true" }
      );

      const response = await allowSpendsHandler.currencyAddressAllowSpends(
        event
      );
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
    });
  });

  describe("currencyAddressSpendTransactions", () => {
    it("should return spend transactions for an address", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        address: data_addresses[1].address,
      });

      const response =
        await allowSpendsHandler.currencyAddressSpendTransactions(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
    });
  });

  describe("currencyAddressAllowSpendExpirations", () => {
    it("should return expired spend transactions for an address", async () => {
      const event = createAPIGatewayEvent({
        metagraph_id: data_metagraphs[0].id,
        address: data_addresses[2].address,
      });

      const response =
        await allowSpendsHandler.currencyAddressAllowSpendExpirations(event);
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
    });
  });
});
