import { APIGatewayProxyResult } from "aws-lambda";
import * as tokenLocksHandler from "../../src/handlers/tokenLocksHandler";
import {
  createAPIGatewayEvent,
  validateResponseStructure,
  validatePaginatedResponse,
} from "../testUtils";
import {
  data_addresses,
  data_global_snapshots,
  data_metagraph_snapshots,
  data_metagraphs,
  data_dag_token_locks,
  data_dag_token_unlocks,
  data_metagraph_token_locks,
  data_metagraph_token_unlocks,
  prisma,
} from "../../prisma/seed";
import { randomUUID } from "crypto";





// Validation functions
const validateDagTokenLock = (lock) => {
  const match = data_dag_token_locks.find(d => d.hash === lock.hash);
  expect(match).toBeDefined();
  if (!match) return;
  
  expect(lock.hash).toBe(match.hash);
  expect(lock.source).toBe(match.source_addr);
  expect(Number(lock.amount)).toBe(Number(match.amount));
  expect(Number(lock.ordinal)).toBe(Number(match.ordinal));
  expect(Number(lock.unlockEpoch)).toBe(Number(match.unlock_epoch));
  expect(lock.timestamp).toBeDefined();
  expect(lock.unlockedAtOrdinal).toBeDefined(); // This could be null if not unlocked
};

const validateDagTokenUnlock = (unlock) => {
  const match = data_dag_token_unlocks.find(d => d.hash === unlock.hash);
  expect(match).toBeDefined();
  if (!match) return;
  
  expect(unlock.hash).toBe(match.hash);
  expect(unlock.source).toBe(match.source_addr);
  expect(Number(unlock.amount)).toBe(Number(match.amount));
  expect(unlock.tokenLockRef).toBe(match.lock_reference_hash);
  expect(unlock.globalSnapshotOrdinal).toBeDefined();
  expect(unlock.timestamp).toBeDefined();
};

const validateMetagraphTokenLock = (lock) => {
  const match = data_metagraph_token_locks.find(d => d.hash === lock.hash);
  expect(match).toBeDefined();
  if (!match) return;
  
  expect(lock.hash).toBe(match.hash);
  expect(lock.source).toBe(match.source_addr);
  expect(Number(lock.amount)).toBe(Number(match.amount));
  expect(Number(lock.ordinal)).toBe(Number(match.ordinal));
  expect(Number(lock.unlockEpoch)).toBe(Number(match.unlock_epoch));
  expect(lock.timestamp).toBeDefined();
  expect(lock.unlockedAtOrdinal).toBeDefined(); // This could be null if not unlocked
};

const validateMetagraphTokenUnlock = (unlock) => {
  const match = data_metagraph_token_unlocks.find(d => d.hash === unlock.hash);
  expect(match).toBeDefined();
  if (!match) return;
  
  expect(unlock.hash).toBe(match.hash);
  expect(unlock.source).toBe(match.source_addr);
  expect(Number(unlock.amount)).toBe(Number(match.amount));
  expect(unlock.tokenLockRef).toBe(match.lock_reference_hash);
  expect(unlock.metagraphSnapshotOrdinal).toBeDefined();
  expect(unlock.timestamp).toBeDefined();
};


describe("Token Locks Handler Integration Tests", () => {
  // DAG Token Locks Tests
  describe("tokenLocks", () => {
    it("should return a list of token locks", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_dag_token_locks.length);
      validateDagTokenLock(body.data[0]);
    });
    
    it("should handle pagination correctly", async () => {
      const event = createAPIGatewayEvent({}, { limit: "1" });
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(1);
      expect(body.meta.next).toBeDefined();
      
      // Try getting the next page
      const nextEvent = createAPIGatewayEvent({}, { limit: "1", next: body.meta.next });
      const nextResponse = await tokenLocksHandler.tokenLocks(nextEvent);
      
      expect(nextResponse.statusCode).toBe(200);
      const nextBody = validatePaginatedResponse(nextResponse);
      
      expect(nextBody.data.length).toBe(1);
      expect(nextBody.data[0].hash).not.toBe(body.data[0].hash);
    });
    
    it("should filter active token locks", async () => {
      const event = createAPIGatewayEvent({}, { active: "true" });
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      // Only the second and third token lock should be active (not unlocked)
      expect(body.data.length).toBe(2);
      expect(body.data[1].hash).toBe(data_dag_token_locks[1].hash);
      expect(body.data[0].hash).toBe(data_dag_token_locks[2].hash);
    });
  });
  
  describe("tokenLock", () => {
    it("should return a specific token lock by hash", async () => {
      const hash = data_dag_token_locks[0].hash;
      const event = createAPIGatewayEvent({ hash });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenLock(event);
      
      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];
      
      validateDagTokenLock(body);
      expect(body.hash).toBe(hash);
    });
    
    it("should return 404 for non-existent token lock", async () => {
      const hash = "non-existent-hash";
      const event = createAPIGatewayEvent({ hash });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenLock(event);
      
      expect(response.statusCode).toBe(404);
    });
  });
  
  describe("globalSnapshotTokenLocks", () => {
    it("should return token locks for a specific global snapshot by hash", async () => {
      const hash_or_ordinal = data_global_snapshots[0].hash;
      const event = createAPIGatewayEvent({ hash_or_ordinal });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.globalSnapshotTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(2);
      expect(body.data[1].hash).toBe(data_dag_token_locks[0].hash);
      expect(body.data[0].hash).toBe(data_dag_token_locks[1].hash);
    });
    
    it("should return token locks for a specific global snapshot by ordinal", async () => {
      const hash_or_ordinal = data_global_snapshots[0].ordinal.toString();
      const event = createAPIGatewayEvent({ hash_or_ordinal });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.globalSnapshotTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(2);
      expect(body.data[1].hash).toBe(data_dag_token_locks[0].hash);
      expect(body.data[0].hash).toBe(data_dag_token_locks[1].hash);
    });
  });
  
  describe("addressTokenLocks", () => {
    it("should return token locks for a specific address", async () => {
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ address });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.addressTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_dag_token_locks.length);
      body.data.forEach(validateDagTokenLock);
    });

    it("should return active token locks for a specific address", async () => {
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ address },{ active: "true" });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.addressTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(2);
      body.data.forEach(validateDagTokenLock);
    });
    
    it("should return empty array for address with no token locks", async () => {
      const address = "non-existent-address";
      const event = createAPIGatewayEvent({ address });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.addressTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(0);
    });
  });
  
  // DAG Token Unlocks Tests
  describe("tokenUnlocks", () => {
    it("should return a list of token unlocks", async () => {
      const event = createAPIGatewayEvent({}, { limit: "10" });
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenUnlocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_dag_token_unlocks.length);
      validateDagTokenUnlock(body.data[0]);
    });
  });
  
  describe("tokenUnlock", () => {
    it("should return a specific token unlock by hash", async () => {
      const hash = data_dag_token_unlocks[0].hash;
      const event = createAPIGatewayEvent({ hash });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenUnlock(event);
      
      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];
      
      validateDagTokenUnlock(body);
      expect(body.hash).toBe(hash);
    });
    
    it("should return 404 for non-existent token unlock", async () => {
      const hash = "non-existent-hash";
      const event = createAPIGatewayEvent({ hash });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.tokenUnlock(event);
      
      expect(response.statusCode).toBe(404);
    });
  });
  
  describe("globalSnapshotTokenUnlocks", () => {
    it("should return token unlocks for a specific global snapshot", async () => {
      const hash_or_ordinal = data_global_snapshots[1].hash;
      const event = createAPIGatewayEvent({ hash_or_ordinal });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.globalSnapshotTokenUnlocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(1);
      expect(body.data[0].hash).toBe(data_dag_token_unlocks[0].hash);
    });
  });
  
  describe("addressTokenUnlocks", () => {
    it("should return token unlocks for a specific address", async () => {
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ address });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.addressTokenUnlocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_dag_token_unlocks.length);
      validateDagTokenUnlock(body.data[0]);
    });
  });
  
  // Metagraph Token Locks Tests
  describe("metagraphTokenLocks", () => {
    it("should return token locks for a specific metagraph", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const event = createAPIGatewayEvent({ metagraph_id });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_metagraph_token_locks.length);
      validateMetagraphTokenLock(body.data[0]);
    });
    
    it("should filter active metagraph token locks", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const event = createAPIGatewayEvent({ metagraph_id }, { active: "true" });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      // Only the second token lock should be active (not unlocked)
      expect(body.data.length).toBe(1);
      expect(body.data[0].hash).toBe(data_metagraph_token_locks[1].hash);
    });
  });
  
  describe("metagraphTokenLock", () => {
    it("should return a specific metagraph token lock", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const hash = data_metagraph_token_locks[0].hash;
      const event = createAPIGatewayEvent({ metagraph_id, hash });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphTokenLock(event);
      
      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];
      
      validateMetagraphTokenLock(body);
      expect(body.hash).toBe(hash);
    });
  });
  
  describe("metagraphSnapshotTokenLocks", () => {
    it("should return token locks for a specific metagraph snapshot", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const hash_or_ordinal = data_metagraph_snapshots[0].hash;
      const event = createAPIGatewayEvent({ metagraph_id, hash_or_ordinal });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphSnapshotTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(1);
      expect(body.data[0].hash).toBe(data_metagraph_token_locks[0].hash);
    });
  });
  
  describe("metagraphAddressTokenLocks", () => {
    it("should return token locks for a specific address in a metagraph", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ metagraph_id, address });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphAddressTokenLocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_metagraph_token_locks.length);
      validateMetagraphTokenLock(body.data[0]);
    });
  });
  
  // Metagraph Token Unlocks Tests
  describe("metagraphTokenUnlocks", () => {
    it("should return token unlocks for a specific metagraph", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const event = createAPIGatewayEvent({ metagraph_id });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphTokenUnlocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_metagraph_token_unlocks.length);
      validateMetagraphTokenUnlock(body.data[0]);
    });
  });
  
  describe("metagraphTokenUnlock", () => {
    it("should return a specific metagraph token unlock", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const hash = data_metagraph_token_unlocks[0].hash;
      const event = createAPIGatewayEvent({ metagraph_id, hash });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphTokenUnlock(event);
      
      expect(response.statusCode).toBe(200);
      const body = validateResponseStructure(response)["data"];
      
      validateMetagraphTokenUnlock(body);
      expect(body.hash).toBe(hash);
    });
  });
  
  describe("metagraphSnapshotTokenUnlocks", () => {
    it("should return token unlocks for a specific metagraph snapshot", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const hash_or_ordinal = data_metagraph_snapshots[1].hash;
      const event = createAPIGatewayEvent({ metagraph_id, hash_or_ordinal });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphSnapshotTokenUnlocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(1);
      expect(body.data[0].hash).toBe(data_metagraph_token_unlocks[0].hash);
    });
  });
  
  describe("metagraphAddressTokenUnlocks", () => {
    it("should return token unlocks for a specific address in a metagraph", async () => {
      const metagraph_id = data_metagraphs[0].id;
      const address = data_addresses[0].address;
      const event = createAPIGatewayEvent({ metagraph_id, address });
      
      const response: APIGatewayProxyResult = await tokenLocksHandler.metagraphAddressTokenUnlocks(event);
      
      expect(response.statusCode).toBe(200);
      const body = validatePaginatedResponse(response);
      
      expect(body.data.length).toBe(data_metagraph_token_unlocks.length);
      validateMetagraphTokenUnlock(body.data[0]);
    });
  });
});
