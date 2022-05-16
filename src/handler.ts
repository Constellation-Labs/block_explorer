import { getClient } from "./opensearch";
import {
  getBlock,
  getGlobalSnapshot,
  getGlobalSnapshotRewards,
  getTransaction,
  getTransactionsByAddress,
  getTransactionsByDestination,
  getTransactionsBySource,
} from "./service";

const osClient = getClient();

export const globalSnapshot = (event) => getGlobalSnapshot(event, osClient)();
export const globalSnapshotRewards = (event) =>
  getGlobalSnapshotRewards(event, osClient)();
export const block = (event) => getBlock(event, osClient)();
export const transaction = (event) => getTransaction(event, osClient)();
export const transactionsByAddress = (event) =>
  getTransactionsByAddress(event, osClient)();
export const transactionsBySource = (event) =>
  getTransactionsBySource(event, osClient)();
export const transactionsByDestination = (event) =>
  getTransactionsByDestination(event, osClient)();
