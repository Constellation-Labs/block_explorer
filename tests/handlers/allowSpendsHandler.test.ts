import { APIGatewayProxyResult } from "aws-lambda";
import * as allowSpendsHandler from "../../src/handlers/allowSpendsHandler";
import {
  createAPIGatewayEvent,
  validatePaginatedResponse,
  validatePaginationNext,
  validateResponseStructure,
} from "../testUtils";
import {
  data_addresses,
  data_dag_allow_spends,
  data_dag_expired_spend_transactions,
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
  expect(entry.globalSnapshotHash).toBeDefined();
  expect(entry.globalSnapshotOrdinal).toBeDefined();
};

const validateDagSpendTransaction = (entry) => {
  const match = data_metagraph_spend_transactions.find(
    (d) => d.hash === entry.hash && d.currency_id === null
  );
  expect(match).toBeDefined();
  if (!match) return;

  expect(Number(entry.amount)).toBe(Number(match.amount));
  expect(entry.source).toBe(match.source_addr);
  expect(entry.destination).toBe(match.destination_addr);
  expect(entry.allowSpendHash).toBe(match.allow_spend_ref);
  expect(entry.snapshotHash).toBe(match.snapshot_hash);
  expect(entry.timestamp).toBeDefined();
  expect(entry.globalSnapshotHash).toBeDefined();
  expect(entry.globalSnapshotOrdinal).toBeDefined();
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
  expect(entry.globalSnapshotHash).toBeDefined();
  expect(entry.globalSnapshotOrdinal).toBeDefined();
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
  expect(entry.globalSnapshotHash).toBeDefined();
  expect(entry.globalSnapshotOrdinal).toBeDefined();
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
  expect(entry.globalSnapshotHash).toBeDefined();
  expect(entry.globalSnapshotOrdinal).toBeDefined();
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
  expect(entry.globalSnapshotHash).toBeDefined();
  expect(entry.globalSnapshotOrdinal).toBeDefined();
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

  it("allowSpendsPagination", async () => {
    const metagraph_id = data_metagraph_allow_spends[0].metagraph_id;
    const address = data_metagraph_allow_spends[0].source_addr;
    await validatePaginationNext("1", {}, allowSpendsHandler.allowSpends);
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

    it("globalSnapshotAllowSpendsPagination", async () => {
      await validatePaginationNext(
        "1",
        {},
        allowSpendsHandler.globalSnapshotAllowSpends
      );
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

    it("addressAllowSpendsPagination", async () => {
      const address = data_addresses[0].address;
      await validatePaginationNext(
        "1",
        { address },
        allowSpendsHandler.addressAllowSpends
      );
    });
  });

  describe("spendTransactions", () => {
    it("should return spend transactions", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(2);
      validateDagSpendTransaction(body.data[0]);
      validateDagSpendTransaction(body.data[1]);
    });

    it("should return spend transaction for a allow spend ref", async () => {
      const event = createAPIGatewayEvent(
        {},
        { allowSpendRef: data_dag_allow_spends[4].hash }
      );
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      expect(body.data[0].hash).toBe(data_metagraph_spend_transactions[2].hash);
      validateDagSpendTransaction(body.data[0]);
    });

    it("should return empty for an invalid allow spend ref", async () => {
      const event = createAPIGatewayEvent({}, { allowSpendRef: "some" });
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(0);
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

      const response =
        await allowSpendsHandler.currencyAddressSpendTransactions(event);
      expect(response.statusCode).toBe(200);

      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(validateDagSpendTransaction);
    });

    // it("addressSpendTransactionsPagination", async () => {
    //   const address = data_addresses[0].address;
    //   await validatePaginationNext("1", {address}, allowSpendsHandler.addressSpendTransactions);
    // });
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
    // it("addressAllowSpendExpirationsPagination", async () => {
    //   const address = data_addresses[0].address;
    //   await validatePaginationNext("1", {address}, allowSpendsHandler.addressAllowSpendExpirations);
    // });
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
      expect(body.data.length).toBe(4);
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

  it("currencyAllowSpendsPagination", async () => {
    const metagraph_id = data_metagraphs[0].id;
    await validatePaginationNext(
      "1",
      { metagraph_id },
      allowSpendsHandler.currencyAllowSpends
    );
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

    it("should return spend transaction for a allow spend ref", async () => {
      const event = createAPIGatewayEvent(
        {},
        { allowSpendRef: data_metagraph_spend_transactions[1].allow_spend_ref }
      );
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(1);
      expect(body.data[0].hash).toBe(data_metagraph_spend_transactions[1].hash);
      validateMgSpendTransaction(body.data[0]);
    });

    it("should return empty for an invalid allow spend ref", async () => {
      const event = createAPIGatewayEvent({}, { allowSpendRef: "some" });
      const response = await allowSpendsHandler.currencySpendTransactions(
        event
      );

      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      expect(body.data.length).toBe(0);
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
    // it("currencyAllowSpendExpirationsPagination", async () => {
    //   const metagraph_id= data_metagraphs[0].id
    //   await validatePaginationNext("1", {metagraph_id}, allowSpendsHandler.currencyAllowSpendExpirations);
    // });
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

    // it("currencySnapshotAllowSpendsPagination", async () => {
    //   const metagraph_id= data_metagraphs[0].id
    //   const hash_or_ordinal=  data_metagraph_snapshots[0].hash
    //   await validatePaginationNext("1", {metagraph_id, hash_or_ordinal}, allowSpendsHandler.currencySnapshotAllowSpends);
    // });
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
    // it("currencySnapshotSpendTransactionsPagination", async () => {
    //   const metagraph_id= data_metagraphs[0].id
    //   const hash_or_ordinal=  data_metagraph_snapshots[0].hash
    //   await validatePaginationNext("1", {metagraph_id, hash_or_ordinal}, allowSpendsHandler.currencySnapshotSpendTransactions);
    // });
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
    // it("currencySnapshotAllowSpendExpirationsPagination", async () => {
    //   const metagraph_id= data_metagraphs[0].id
    //   const hash_or_ordinal=  data_metagraph_snapshots[0].hash
    //   await validatePaginationNext("1", {metagraph_id, hash_or_ordinal}, allowSpendsHandler.currencySnapshotAllowSpendExpirations);
    // });
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
    it("currencyAddressAllowSpendsPagination", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const address = data_addresses[1].address;
      await validatePaginationNext(
        "1",
        { metagraph_id, address },
        allowSpendsHandler.currencyAddressAllowSpends
      );
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
    // it("currencyAddressSpendTransactionsPagination", async () => {
    //   const metagraph_id= data_metagraphs[0].id
    //   const address = data_addresses[1].address
    //   await validatePaginationNext("1", {metagraph_id, address}, allowSpendsHandler.currencyAddressSpendTransactions);
    // });
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
    // it("currencyAddressAllowSpendExpirationsPagination", async () => {
    //   const metagraph_id= data_metagraphs[0].id
    //   const address = data_addresses[0].address
    //   await validatePaginationNext("1", {metagraph_id, address}, allowSpendsHandler.currencyAddressAllowSpendExpirations);
    // });
  });
});
